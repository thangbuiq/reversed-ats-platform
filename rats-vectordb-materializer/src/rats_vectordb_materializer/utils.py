"""Utility functions for RATS VectorDB Materializer."""

from __future__ import annotations

import logging
import os
from typing import Any, Iterable

from rats_vectordb_materializer.config import OUTPUT_SCHEMA_COLUMNS, DatabricksSettings


def is_databricks_runtime():
    return "DATABRICKS_RUNTIME_VERSION" in os.environ


def get_databricks_settings(databricks_host=None, databricks_token=None):
    if databricks_host and databricks_token:
        return DatabricksSettings(databricks_host=databricks_host, databricks_token=databricks_token)
    if os.path.exists(".env"):
        return DatabricksSettings()
    if os.environ.get("DATABRICKS_HOST") and os.environ.get("DATABRICKS_TOKEN"):
        return DatabricksSettings(
            databricks_host=os.environ["DATABRICKS_HOST"],
            databricks_token=os.environ["DATABRICKS_TOKEN"],
        )
    raise ValueError("Please provide DATABRICKS_HOST and DATABRICKS_TOKEN.")


def get_logger(log_level=logging.INFO):
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s - %(lineno)d - %(message)s",
    )
    logger = logging.getLogger(__name__)
    logger.info("Logging is set up.")
    return logger


def chunks[T](items: list[T], size: int) -> Iterable[list[T]]:
    """Yield successive chunks of *size* from *items*."""
    for index in range(0, len(items), size):
        yield items[index : index + size]


def stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value).strip()


def build_job_embedding_text(job_row: dict[str, Any]) -> str:
    """Build a deterministic embedding text from the output schema fields."""
    parts: list[str] = []
    for column in OUTPUT_SCHEMA_COLUMNS:
        value = stringify(job_row.get(column))
        if value:
            parts.append(f"{column}: {value}")
    return "\n".join(parts)


def build_point_id(job_row: dict[str, Any]) -> str:
    """Create a stable point id from schema columns."""
    snapshot_id = stringify(job_row.get("job_snapshot_id"))
    if snapshot_id:
        return snapshot_id
    fallback = ":".join(
        stringify(job_row.get(column))
        for column in ("job_id", "part_date", "inserted_at")
        if stringify(job_row.get(column))
    )
    if fallback:
        return fallback
    raise RuntimeError("Cannot derive point id from job row.")
