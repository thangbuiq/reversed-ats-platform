"""Custom exceptions for the scraper package."""


class ScraperException(Exception):
    """Base exception for all scraper errors."""

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ScrapingError(ScraperException):
    """Raised when job scraping fails."""

    pass


class KafkaProducerError(ScraperException):
    """Raised when Kafka production fails."""

    pass


class ConfigurationError(ScraperException):
    """Raised when configuration is invalid."""

    pass
