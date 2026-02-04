"""Data models for the scraper package."""

from producer.models.job import JobListing, ScrapeResult
from producer.models.schema import JOB_LISTING_SCHEMA

__all__ = ["JOB_LISTING_SCHEMA", "JobListing", "ScrapeResult"]
