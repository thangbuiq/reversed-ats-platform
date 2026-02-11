"""LinkedIn scraper implementation powered by JobSpy."""

from jobspy import scrape_jobs
from loguru import logger
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from rats_kafka_producer.config.models import JobListing
from rats_kafka_producer.config.settings import ScraperConfig


class JobSpyScraper:
    """Job scraping class using jobspy package with retry logic."""

    def __init__(self, config: ScraperConfig):
        self.config = config
        logger.info("JobSpyScraper initialized")

    def _create_retry_decorator(self):
        """Create retry decorator with config values."""
        return retry(
            stop=stop_after_attempt(self.config.retry.max_attempts),
            wait=wait_exponential(
                min=self.config.retry.wait_min,
                max=self.config.retry.wait_max,
            ),
            retry=retry_if_exception_type(Exception),
            before_sleep=before_sleep_log(logger, "WARNING"),
        )

    def scrape_jobs_for_term(
        self,
        search_term: str,
        site_names: list[str] | None = None,
        location: str | None = None,
        results_wanted: int | None = None,
    ) -> list[JobListing]:
        """Scrape jobs for a specific search term."""
        site_names = site_names or self.config.site_names
        location = location or self.config.location
        results_wanted = results_wanted or self.config.results_wanted

        logger.info(
            f"Scraping jobs for term: '{search_term}', "
            f"sites: {site_names}, location: '{location}', "
            f"results wanted: {results_wanted}"
        )

        @self._create_retry_decorator()
        def _scrape():
            return scrape_jobs(
                site_name=site_names,
                search_term=search_term,
                location=location,
                linkedin_fetch_description=self.config.linkedin_fetch_description,
                results_wanted=results_wanted,
            )

        try:
            jobs_df = _scrape()
            raw_jobs = jobs_df.to_dict("records")

            jobs = [JobListing.from_raw(job, search_term) for job in raw_jobs]
            logger.success(f"Successfully scraped {len(jobs)} jobs for '{search_term}'")
            return jobs

        except Exception as e:
            logger.error(f"Error scraping jobs for '{search_term}': {str(e)}")
            raise

    def scrape_all_terms(
        self,
        search_terms: list[str] | None = None,
    ) -> dict[str, list[JobListing]]:
        """Scrape jobs for all search terms."""
        search_terms = search_terms or self.config.search_terms
        all_jobs: dict[str, list[JobListing]] = {}

        logger.info(f"Starting scraping for {len(search_terms)} search terms")

        for term in search_terms:
            try:
                jobs = self.scrape_jobs_for_term(search_term=term)
                all_jobs[term] = jobs
            except Exception as e:
                logger.error(f"Failed to scrape jobs for '{term}' after all retries: {str(e)}")
                all_jobs[term] = []

        total_jobs = sum(len(jobs) for jobs in all_jobs.values())
        logger.info(f"Completed scraping. Total jobs found: {total_jobs}")

        return all_jobs
