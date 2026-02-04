"""Factory for creating scraper instances."""

from typing import Type

from producer.config.settings import ScraperConfig
from producer.core.base import BaseScraper
from producer.core.exceptions import ConfigurationError


class ScraperFactory:
    """Factory class for creating scraper instances."""

    _registry: dict[str, Type[BaseScraper]] = {}

    @classmethod
    def register(cls, platform: str):
        """Decorator to register a scraper class."""

        def decorator(scraper_class: Type[BaseScraper]):
            cls._registry[platform.lower()] = scraper_class
            return scraper_class

        return decorator

    @classmethod
    def create(cls, platform: str, config: ScraperConfig) -> BaseScraper:
        """Create a scraper instance for the specified platform."""
        platform_lower = platform.lower()

        if platform_lower not in cls._registry:
            available = ", ".join(cls._registry.keys())
            raise ConfigurationError(f"Unknown platform: {platform}. Available: {available}")

        scraper_class = cls._registry[platform_lower]
        return scraper_class(config)

    @classmethod
    def available_platforms(cls) -> list[str]:
        """Return list of available platforms."""
        return list(cls._registry.keys())


# Import scrapers to trigger registration
from producer.scrapers import linkedin  # noqa: F401, E402
