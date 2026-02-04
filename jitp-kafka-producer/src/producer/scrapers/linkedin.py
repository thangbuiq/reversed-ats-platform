"""LinkedIn job scraper implementation."""

from typing import AsyncGenerator
from urllib.parse import urlencode

from playwright.async_api import Page

from producer.config.settings import ScraperConfig
from producer.core.base import BaseScraper
from producer.core.exceptions import AuthenticationError, ParseError
from producer.models.job import JobPosting
from producer.scrapers.factory import ScraperFactory
from producer.utils.browser import BrowserManager


@ScraperFactory.register("linkedin")
class LinkedInScraper(BaseScraper):
    """Scraper for LinkedIn job postings."""

    BASE_URL = "https://www.linkedin.com"
    JOBS_URL = f"{BASE_URL}/jobs/search"

    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self._browser_manager = BrowserManager(config.browser)
        self._page: Page | None = None
        self._is_authenticated = False

    @property
    def name(self) -> str:
        return "LinkedIn"

    @property
    def supported_platforms(self) -> list[str]:
        return ["linkedin"]

    async def initialize(self) -> None:
        """Initialize browser."""
        self.logger.info("Initializing LinkedIn scraper")
        await self._browser_manager.start()
        self._page = await self._browser_manager.new_page()

    async def cleanup(self) -> None:
        """Cleanup browser resources."""
        self.logger.info("Cleaning up LinkedIn scraper")
        await self._browser_manager.stop()

    async def authenticate(self) -> bool:
        """Authenticate with LinkedIn."""
        credentials = self.config.get_credentials("linkedin")

        if not credentials.username or not credentials.password:
            self.logger.warning("No credentials provided, running in anonymous mode")
            return True

        try:
            self.logger.info("Authenticating with LinkedIn")
            await self._page.goto(f"{self.BASE_URL}/login")
            await self._page.fill('input[name="session_key"]', credentials.username)
            await self._page.fill('input[name="session_password"]', credentials.password)
            await self._page.click('button[type="submit"]')

            await self._page.wait_for_load_state("networkidle")
            await self._browser_manager.random_delay(2, 4)

            # Check for successful login
            if "/feed" in self._page.url or "/jobs" in self._page.url:
                self._is_authenticated = True
                self.logger.info("Authentication successful")
                return True

            # Check for security challenge
            if "checkpoint" in self._page.url:
                raise AuthenticationError("Security checkpoint detected")

            raise AuthenticationError("Login failed - unexpected redirect")

        except Exception as e:
            self.logger.error(f"Authentication failed: {e}")
            raise AuthenticationError(str(e))

    async def scrape_jobs(
        self,
        keywords: list[str],
        location: str | None = None,
        max_results: int = 100,
    ) -> AsyncGenerator[JobPosting, None]:
        """Scrape jobs from LinkedIn."""
        search_query = " ".join(keywords)
        jobs_scraped = 0
        page_num = 0

        while jobs_scraped < max_results:
            params = {
                "keywords": search_query,
                "start": page_num * 25,
            }
            if location:
                params["location"] = location

            url = f"{self.JOBS_URL}?{urlencode(params)}"
            self.logger.info(f"Scraping page {page_num + 1}: {url}")

            await self._page.goto(url)
            await self._page.wait_for_load_state("networkidle")
            await self._browser_manager.random_delay(
                self.config.request_delay_min,
                self.config.request_delay_max,
            )

            # Get job cards
            job_cards = await self._page.query_selector_all(".job-card-container")

            if not job_cards:
                self.logger.info("No more job cards found")
                break

            for card in job_cards:
                if jobs_scraped >= max_results:
                    break

                try:
                    job = await self._parse_job_card(card)
                    if job:
                        jobs_scraped += 1
                        yield job
                except ParseError as e:
                    self.logger.warning(f"Failed to parse job card: {e}")
                    continue

            page_num += 1

        self.logger.info(f"Scraped {jobs_scraped} jobs total")

    async def _parse_job_card(self, card) -> JobPosting | None:
        """Parse a job card element into a JobPosting."""
        try:
            job_id_attr = await card.get_attribute("data-job-id")
            job_id = job_id_attr or f"linkedin_{hash(await card.inner_text())}"

            title_el = await card.query_selector(".job-card-list__title")
            title = await title_el.inner_text() if title_el else "Unknown"

            company_el = await card.query_selector(".job-card-container__company-name")
            company = await company_el.inner_text() if company_el else "Unknown"

            location_el = await card.query_selector(".job-card-container__metadata-item")
            location = await location_el.inner_text() if location_el else None

            link_el = await card.query_selector("a.job-card-list__title")
            url = None
            if link_el:
                href = await link_el.get_attribute("href")
                if href:
                    url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

            return JobPosting(
                id=job_id,
                platform="linkedin",
                title=title.strip(),
                company=company.strip(),
                location=location.strip() if location else None,
                url=url,
            )

        except Exception as e:
            raise ParseError(f"Failed to parse job card: {e}")

    async def scrape_job_details(self, job_id: str) -> JobPosting | None:
        """Scrape detailed information for a specific job."""
        url = f"{self.BASE_URL}/jobs/view/{job_id}"
        await self._page.goto(url)
        await self._page.wait_for_load_state("networkidle")

        # Implementation for detailed job parsing
        # This would extract full description, requirements, etc.
        self.logger.info(f"Scraping job details for {job_id}")
        return None  # Implement full parsing as needed
