"""Main pipeline orchestrating job scraping and Kafka production."""

from loguru import logger

from producer.config.settings import ScraperConfig
from producer.models.job import PipelineStats, ScrapeProducerResult
from producer.producers.kafka_producer import KafkaJobProducer
from producer.scrapers.jobspy_scraper import JobSpyScraper


class JobScraperPipeline:
    """Main pipeline orchestrating job scraping and Kafka production."""

    def __init__(self, config: ScraperConfig | None = None):
        self.config = config or ScraperConfig.from_env()
        self.scraper = JobSpyScraper(self.config)
        self.producer = KafkaJobProducer(self.config)
        logger.success("JobScraperPipeline initialized")

    def run(
        self,
        search_terms: list[str] | None = None,
        produce_to_kafka: bool = True,
    ) -> PipelineStats:
        """Run the complete pipeline: scrape jobs and produce to Kafka."""
        logger.info("=" * 80)
        logger.info("Starting Job Scraper Pipeline")
        logger.info("=" * 80)

        stats = PipelineStats()
        all_jobs = self.scraper.scrape_all_terms(search_terms)

        for search_term, jobs in all_jobs.items():
            result = ScrapeProducerResult(search_term=search_term)
            result.scraped_count = len(jobs)

            if jobs and produce_to_kafka:
                successful, failed = self.producer.produce_jobs_batch(jobs)
                result.produced_count = successful
                result.failed_count = failed

            stats.search_terms[search_term] = result
            stats.total_jobs_scraped += result.scraped_count
            stats.total_jobs_produced += result.produced_count
            stats.total_jobs_failed += result.failed_count

        stats.complete()

        logger.info("=" * 80)
        logger.info("Pipeline Execution Summary:")
        logger.info(f"  Total jobs scraped: {stats.total_jobs_scraped}")
        logger.info(f"  Total jobs produced: {stats.total_jobs_produced}")
        logger.info(f"  Total jobs failed: {stats.total_jobs_failed}")
        logger.info(f"  Duration: {stats.duration_seconds:.2f} seconds")
        logger.info("=" * 80)

        return stats

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.producer.close()
        logger.info("Pipeline resources cleaned up")
