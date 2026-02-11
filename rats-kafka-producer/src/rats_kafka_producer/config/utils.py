"""Utility functions for sanitizing values, particularly handling NaN/NaT/pandas NA."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import TYPE_CHECKING, Any

import yaml  # type: ignore

if TYPE_CHECKING:
    from rats_kafka_producer.config.models import ScraperConfig


def _is_nan(value: Any) -> bool:
    """Check if a value is NaN/NaT/pandas NA."""
    if value is None:
        return False
    if isinstance(value, float) and math.isnan(value):
        return True
    str_repr = str(value)
    return str_repr in ("nan", "NaT", "<NA>")


def sanitize_value(value: Any) -> Any:
    """Convert any pandas NaN/NaT/NA to None."""
    return None if _is_nan(value) else value


def load_config(
    config_file: Path | None = None,
    overrides: dict[str, Any] | None = None,
) -> "ScraperConfig":
    """
    Load configuration with the following precedence:

    1. CLI overrides (highest) 2. Config file (YAML/JSON) 3. Environment variables 4. Defaults (lowest)
    """
    # 1. Start with config from environment variables
    # This handles the specific env var mapping defined in from_env
    from rats_kafka_producer.config.settings import ScraperConfig

    base_config = ScraperConfig.from_env()
    config_data = base_config.model_dump()

    # 2. Load from file if provided and merge
    if config_file and config_file.exists():
        file_config = {}
        content = config_file.read_text()
        if config_file.suffix in (".yml", ".yaml"):
            file_config = yaml.safe_load(content) or {}
        elif config_file.suffix == ".json":
            file_config = json.loads(content)

        if file_config:
            config_data = _deep_merge(config_data, file_config)

    # 3. Apply CLI overrides
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
