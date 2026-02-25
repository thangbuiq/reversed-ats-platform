"""Cached service factories used as FastAPI dependencies."""

from __future__ import annotations

from functools import lru_cache

from .services.databricks import DatabricksStatementClient
from .services.vector_store import VectorStoreService


@lru_cache(maxsize=1)
def get_vector_store() -> VectorStoreService:
    """Create and cache the vector store service."""
    return VectorStoreService()


@lru_cache(maxsize=1)
def get_databricks_client() -> DatabricksStatementClient:
    """Create and cache the Databricks client."""
    return DatabricksStatementClient()
