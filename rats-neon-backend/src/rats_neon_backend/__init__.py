"""Public interface for the RATS Neon backend package."""

__version__ = "0.1.0"
__author__ = "RATS Team"

from rats_neon_backend.config.settings import ScraperConfig
from rats_neon_backend.pipeline import RATSBackendApp
from rats_neon_backend.sinks.postgres import PostgresJobSink
from rats_neon_backend.sources.linkedin import JobSpyScraper

__all__ = [
    "JobSpyScraper",
    "PostgresJobSink",
    "RATSBackendApp",
    "ScraperConfig",
]
