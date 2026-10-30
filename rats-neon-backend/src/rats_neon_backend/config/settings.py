"""Configuration settings loaded from environment variables."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List

import dotenv
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from rats_neon_backend.config.utils import logger


class DatabaseConfig(BaseModel):
    """
    Neon (PostgreSQL) settings.

    Use the pooled connection string with sslmode=require.
    """

    url: str = ""
    retention_days: int = Field(default=30, ge=1)
    upsert_batch_size: int = Field(default=200, ge=1)


class QdrantConfig(BaseModel):
    """
    Optional Qdrant settings.

    Vector sync is skipped when url is empty.
    """

    url: str = ""
    api_key: str = ""
    collection: str = "linkedin_jobs"
    embed_batch_size: int = Field(default=128, ge=1)

    @property
    def enabled(self) -> bool:
        return bool(self.url and self.api_key)


class RetryConfig(BaseModel):
    """Retry configuration."""

    max_attempts: int = 3
    wait_min: int = 2
    wait_max: int = 10


class ScraperConfig(BaseSettings):
    """Main configuration for the scraper and its sinks."""

    model_config = SettingsConfigDict(
        extra="ignore",
    )

    # Job scraping settings
    site_names: List[str] = Field(default=["linkedin"])
    location: str = Field(default="Ho Chi Minh City, Vietnam")
    results_wanted: int = Field(default=20, ge=1, le=1000)
    hours_old: int | None = Field(default=24, ge=1)
    linkedin_fetch_description: bool = True
    search_terms: List[str] = Field(default=["Data Engineer"])

    # Sinks
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    qdrant: QdrantConfig = Field(default_factory=QdrantConfig)

    # Retry settings
    retry: RetryConfig = Field(default_factory=RetryConfig)

    # Output settings
    output_dir: Path = Field(default=Path("./output"))
    output_format: str = Field(default="json", pattern="^(json|csv|parquet)$")

    # Logging
    log_level: str = Field(default="INFO")

    @classmethod
    def from_env(cls) -> "ScraperConfig":
        """Load config primarily from environment variables."""
        dotenv.load_dotenv()
        logger.debug("Loading configuration from environment variables")

        def env(key: str, default: str | None = None) -> str | None:
            return os.getenv(key, default)

        def parse_list(key: str) -> list[str] | None:
            val = env(key)
            if not val:
                return None
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return [x.strip() for x in val.split(",") if x.strip()]

        kwargs = {}
        if site_names := parse_list("SITE_NAMES"):
            kwargs["site_names"] = site_names
        if search_terms := parse_list("SEARCH_TERMS"):
            kwargs["search_terms"] = search_terms
        if (desc := env("LINKEDIN_FETCH_DESCRIPTION")) is not None:
            kwargs["linkedin_fetch_description"] = desc.lower() == "true"
        if (hours_old := env("HOURS_OLD")) is not None and hours_old != "":
            kwargs["hours_old"] = int(hours_old)

        # BaseSettings may try to decode these list env vars as JSON. Remove them
        # temporarily so our explicit parse_list fallback can handle CSV values.
        restored_env: dict[str, str] = {}
        for key in ("SITE_NAMES", "SEARCH_TERMS"):
            value = os.environ.pop(key, None)
            if value is not None:
                restored_env[key] = value

        try:
            return cls(
                location=env("JOB_LOCATION", "Ho Chi Minh City, Vietnam") or "Ho Chi Minh City, Vietnam",
                results_wanted=int(env("RESULTS_WANTED", "20") or "20"),
                log_level=env("LOG_LEVEL", "INFO") or "INFO",
                database=DatabaseConfig(
                    url=env("DATABASE_URL", "") or "",
                    retention_days=int(env("JOB_RETENTION_DAYS", "30") or "30"),
                ),
                qdrant=QdrantConfig(
                    url=env("QDRANT_URL", "") or "",
                    api_key=env("QDRANT_API_KEY", "") or "",
                    collection=env("QDRANT_COLLECTION", "linkedin_jobs") or "linkedin_jobs",
                ),
                **kwargs,
            )
        finally:
            os.environ.update(restored_env)
