"""Cached service factories used as FastAPI dependencies."""

from __future__ import annotations

from functools import lru_cache

from .services.job_store import JobStore
from .services.vector_store import VectorStoreService


@lru_cache(maxsize=1)
def get_vector_store() -> VectorStoreService:
    """Create and cache the vector store service."""
    return VectorStoreService()


@lru_cache(maxsize=1)
def get_job_store() -> JobStore:
    """Create and cache the Neon job store."""
    return JobStore()
