"""Core components for scrapers."""

from producer.core.exceptions import (
    ConfigurationError,
    KafkaProducerError,
    ScraperException,
    ScrapingError,
)

__all__ = ["ConfigurationError", "KafkaProducerError", "ScraperException", "ScrapingError"]
