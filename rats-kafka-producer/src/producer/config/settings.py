"""Configuration settings with support for env vars, files, and CLI args."""

import json
import os
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class KafkaConfig(BaseModel):
    """Kafka producer configuration."""

    bootstrap_servers: str = "localhost:9092"
    schema_registry_url: str = "http://localhost:8081"
    topic: str = "jitp.job.listings"


class RetryConfig(BaseModel):
    """Retry configuration."""

    max_attempts: int = 3
    wait_min: int = 2
    wait_max: int = 10


class ScraperConfig(BaseSettings):
    """Main configuration for the scraper."""

    model_config = SettingsConfigDict(
        env_prefix="SCRAPER_",
        env_nested_delimiter="__",
        extra="ignore",
    )

    # Job scraping settings
    site_names: list[str] = Field(default=["linkedin"])
    location: str = Field(default="Ho Chi Minh City, Vietnam")
    results_wanted: int = Field(default=20, ge=1, le=1000)
    linkedin_fetch_description: bool = True
    search_terms: list[str] = Field(
        default=[
            "Data Engineer",
            "Data Analyst",
            "Data Scientist",
            "AI Engineer",
            "Software Engineer",
            "DevOps Engineer",
        ]
    )

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

    # Pipeline version
    pipeline_version: str = "1.0.0"

    @classmethod
    def from_env(cls) -> "ScraperConfig":
        """Load config primarily from environment variables."""
        return cls(
            location=os.getenv("JOB_LOCATION", "Ho Chi Minh City, Vietnam"),
            results_wanted=int(os.getenv("RESULTS_WANTED", "20")),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            kafka=KafkaConfig(
                bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
                schema_registry_url=os.getenv("SCHEMA_REGISTRY_URL", "http://localhost:8081"),
                topic=os.getenv("KAFKA_TOPIC", "jitp.job.listings"),
            ),
        )


def load_config(
    config_file: Path | None = None,
    overrides: dict[str, Any] | None = None,
) -> ScraperConfig:
    """
    Load configuration from multiple sources with priority:

    1. CLI overrides (highest) 2. Config file (YAML/JSON) 3. Environment variables 4. Defaults (lowest)
    """
    config_data: dict[str, Any] = {}

    # Load from file if provided
    if config_file and config_file.exists():
        content = config_file.read_text()
        if config_file.suffix in (".yml", ".yaml"):
            config_data = yaml.safe_load(content) or {}
        elif config_file.suffix == ".json":
            config_data = json.loads(content)

    # Apply overrides
    if overrides:
        config_data = _deep_merge(config_data, overrides)

    return ScraperConfig(**config_data)


def _deep_merge(base: dict, override: dict) -> dict:
    """Deep merge two dictionaries."""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result
