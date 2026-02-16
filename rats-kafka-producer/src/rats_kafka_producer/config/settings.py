"""Configuration settings with support for env vars, files, and CLI args."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import List

import dotenv
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from rats_kafka_producer.config.utils import logger


class KafkaConfig(BaseModel):
    """
    Kafka producer configuration for Confluent Cloud and local brokers.

    Credentials default to empty strings for local development scenarios where authentication is not required. The
    producer checks for non-empty credentials before applying authentication.
    """

    bootstrap_servers: str = "localhost:9092"
    schema_registry_url: str = "http://localhost:8081"
    api_key: str = ""
    api_secret: str = ""
    schema_registry_api_key: str = ""
    schema_registry_api_secret: str = ""
    client_id: str = ""
    topic: str = "rats.jobs.listing.v1"


class RetryConfig(BaseModel):
    """Retry configuration."""

    max_attempts: int = 3
    wait_min: int = 2
    wait_max: int = 10


class ScraperConfig(BaseSettings):
    """Main configuration for the scraper."""

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

    # Kafka settings
    kafka: KafkaConfig = Field(default_factory=KafkaConfig)

    # Retry settings
    retry: RetryConfig = Field(default_factory=RetryConfig)

    # Output settings
    output_dir: Path = Field(default=Path("./output"))
    output_format: str = Field(default="json", pattern="^(json|csv|parquet)$")

    # Logging
    log_level: str = Field(default="INFO")
    log_file: str = Field(default="logs/job_scraper_{time}.log")
    log_rotation: str = Field(default="100 MB")
    log_retention: str = Field(default="30 days")

    @classmethod
    def from_env(cls) -> "ScraperConfig":
        """Load config primarily from environment variables."""
        dotenv.load_dotenv()
        logger.debug("Loading configuration from environment variables")

        def resolve_secret_reference(value: str | None) -> str | None:
            """Resolve Databricks secret reference strings when running on Databricks."""
            if not value:
                return value

            match = re.match(r"^\{\{secrets/([^/]+)/([^}]+)\}\}$", value.strip())
            if not match:
                return value

            scope, key = match.group(1), match.group(2)

            try:
                from pyspark.dbutils import DBUtils
                from pyspark.sql import SparkSession

                spark = SparkSession.getActiveSession() or SparkSession.builder.getOrCreate()
                dbutils = DBUtils(spark)
                return dbutils.secrets.get(scope=scope, key=key)
            except Exception as exc:
                logger.warning(
                    "Could not resolve Databricks secret reference for {}/{} ({}). Using raw value.",
                    scope,
                    key,
                    str(exc),
                )
                return value

        def env(key: str, default: str | None = None) -> str | None:
            """Read an environment variable and resolve Databricks secret references."""
            return resolve_secret_reference(os.getenv(key, default))

        # Helper to parse list from env
        def parse_list(key: str) -> list[str] | None:
            val = env(key)
            if not val:
                return None
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return [x.strip() for x in val.split(",") if x.strip()]

        # Prepare kwargs for optional overrides
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
                kafka=KafkaConfig(
                    bootstrap_servers=env("DATACONTRACT_KAFKA_BOOTSTRAP_SERVERS", "localhost:9092") or "localhost:9092",
                    schema_registry_url=env("CONFLUENT_SCHEMA_REGISTRY_URL", "http://localhost:8081")
                    or "http://localhost:8081",
                    topic=env("DATACONTRACT_KAFKA_TOPIC", "rats.jobs.listing.v1") or "rats.jobs.listing.v1",
                    api_key=env("DATACONTRACT_KAFKA_SASL_USERNAME", "") or "",
                    api_secret=env("DATACONTRACT_KAFKA_SASL_PASSWORD", "") or "",
                    schema_registry_api_key=env("CONFLUENT_SCHEMA_REGISTRY_API_KEY", "") or "",
                    schema_registry_api_secret=env("CONFLUENT_SCHEMA_REGISTRY_API_SECRET", "") or "",
                    client_id=env("CONFLUENT_KAFKA_CLIENT_ID", "") or "",
                ),
                **kwargs,
            )
        finally:
            os.environ.update(restored_env)
