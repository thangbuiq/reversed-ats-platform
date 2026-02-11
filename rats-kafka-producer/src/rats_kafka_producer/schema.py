"""Avro schema utilities for the job listing payloads."""

from __future__ import annotations

import json
from importlib.resources import files
from typing import Any


def load_job_listing_schema() -> dict[str, Any]:
    """Load the job listing Avro schema from package data.
    
    This function loads the schema lazily to avoid import-time failures
    when the package structure changes (e.g., during installation).
    """
    schema_file = files("rats_kafka_producer.data").joinpath("job_listing.avsc")
    schema_text = schema_file.read_text(encoding="utf-8")
    return json.loads(schema_text)


# Cache the schema after first load
_SCHEMA_CACHE: dict[str, Any] | None = None


def get_job_listing_schema() -> dict[str, Any]:
    """Get the job listing schema, loading and caching it on first access."""
    global _SCHEMA_CACHE
    if _SCHEMA_CACHE is None:
        _SCHEMA_CACHE = load_job_listing_schema()
    return _SCHEMA_CACHE


# For backward compatibility, provide JOB_LISTING_SCHEMA that calls the getter
# Note: This will still load on import, but will work in installed packages
try:
    JOB_LISTING_SCHEMA = load_job_listing_schema()
except (FileNotFoundError, ModuleNotFoundError, json.JSONDecodeError) as e:
    # If loading fails during import (e.g., during build or when package data is missing),
    # set to None and let users call get_job_listing_schema() directly
    import warnings

    warnings.warn(f"Failed to load schema at import time: {e}. Use get_job_listing_schema() instead.")
    JOB_LISTING_SCHEMA = None
