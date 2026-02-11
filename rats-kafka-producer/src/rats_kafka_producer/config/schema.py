"""Avro schema utilities for the job listing payloads."""

from __future__ import annotations

import json
from importlib.resources import files
from typing import Any, Dict, Optional

_SCHEMA_CACHE: Optional[Dict[str, Any]] = None


def load_job_listing_schema() -> dict[str, Any]:
    """
    Load the job listing Avro schema from package data.

    This function loads the schema lazily to avoid import-time failures when the package structure changes (e.g., during
    installation).
    """
    contract_module = files("rats_kafka_producer.datacontract.schema.avro.com.rats.jobs")
    schema_file = contract_module.joinpath("rats.jobs.listing.v1.avsc")
    schema_text = schema_file.read_text(encoding="utf-8")
    return json.loads(schema_text)


def get_job_listing_schema() -> dict[str, Any]:
    """Get the job listing schema, loading and caching it on first access."""
    global _SCHEMA_CACHE
    if _SCHEMA_CACHE is None:
        _SCHEMA_CACHE = load_job_listing_schema()
    return _SCHEMA_CACHE
