"""Routes package for the RATS Dashboard API."""

from .health import router as health_router
from .jobs import router as jobs_router
from .predict import router as predict_router

__all__ = [
    "health_router",
    "jobs_router",
    "predict_router",
]
