"""Routes package for the RATS Dashboard API."""

from .health import router as health_router
from .jobs import router as jobs_router
from .materialize import router as materialize_router
from .predict import router as predict_router

__all__ = [
    "health_router",
    "jobs_router",
    "materialize_router",
    "predict_router",
]
