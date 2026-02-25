"""Application-wide constants and environment helpers."""

from __future__ import annotations

import os
import re

APP_TITLE = "RATS Dashboard API"
COLLECTION_NAME = "linkedin_jobs"
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
VECTOR_SIZE = 384
QUERY_EMBED_PREFIX = "Represent this sentence for searching relevant passages: "
PASSAGE_EMBED_PREFIX = "Represent this sentence for retrieval: "
POLL_INTERVAL_SECONDS = 1.0
POLL_MAX_ATTEMPTS = 120
DEFAULT_BATCH_SIZE = 128

OUTPUT_SCHEMA_COLUMNS = (
    "part_date",
    "job_snapshot_id",
    "job_id",
    "site",
    "search_term",
    "company_name",
    "company_industry",
    "company_url",
    "location",
    "is_remote",
    "date_posted",
    "job_title",
    "job_type",
    "job_level",
    "job_function",
    "job_description",
    "job_url",
    "job_url_direct",
    "inserted_at",
)


def require_env(name: str) -> str:
    """Return a required environment variable or raise ``RuntimeError``."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def extract_warehouse_id(http_path: str) -> str:
    """Extract the warehouse id from a Databricks HTTP path."""
    match = re.search(r"/warehouses/([^/]+)", http_path)
    if not match:
        raise RuntimeError(
            "Unable to extract warehouse id from DATABRICKS_HTTP_PATH. Set DATABRICKS_WAREHOUSE_ID explicitly."
        )
    return match.group(1)
