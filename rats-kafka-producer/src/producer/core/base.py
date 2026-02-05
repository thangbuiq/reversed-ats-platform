"""Abstract base class for all job scrapers."""

import logging
from abc import ABC, abstractmethod
from typing import Generator

from producer.config.settings import ScraperConfig
from producer.models.job import JobPosting, ScrapeResult


class BaseScraper(ABC):
    """Abstract base class that all scrapers must inherit from."""

    def __init__(self, config: ScraperConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self._is_initialized = False

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the scraper name."""
        pass

    @property
    @abstractmethod
    def supported_platforms(self) -> list[str]:
        """Return list of supported platform identifiers."""
        pass

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the scraper (browser, auth, etc.)."""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Cleanup resources (close browser, etc.)."""
        pass

    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Authenticate with the platform.

        Returns True if successful.
        """
        pass

    @abstractmethod
    async def scrape_jobs(
        self,
        keywords: list[str],
        location: str | None = None,
        max_results: int = 100,
    ) -> Generator[JobPosting, None, None]:
        """
        Scrape jobs based on search criteria.

        Yields JobPosting objects.
        """
        pass

    @abstractmethod
    async def scrape_job_details(self, job_id: str) -> JobPosting | None:
        """Scrape detailed information for a specific job."""
        pass

    async def run(
        self,
        keywords: list[str],
        location: str | None = None,
        max_results: int = 100,
    ) -> ScrapeResult:
        """Main entry point to run the scraper."""
        result = ScrapeResult(scraper_name=self.name)

        try:
            await self.initialize()
            self._is_initialized = True

            if not await self.authenticate():
                result.add_error("Authentication failed")
                return result

            async for job in self.scrape_jobs(keywords, location, max_results):
                result.add_job(job)

        except Exception as e:
            self.logger.exception("Scraping failed")
            result.add_error(str(e))
        finally:
            if self._is_initialized:
                await self.cleanup()

        return result

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup()
