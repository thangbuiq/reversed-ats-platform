"""Pipeline orchestration for scraping jobs and publishing to Kafka."""

from loguru import logger

from rats_kafka_producer.config.models import PipelineStats, ScrapeProducerResult
from rats_kafka_producer.config.settings import ScraperConfig
from rats_kafka_producer.sinks.kafka import KafkaJobProducer
from rats_kafka_producer.sources.linkedin import JobSpyScraper


class RATSProducerApp:
    """Main pipeline orchestrating job scraping and Kafka production."""

    def __init__(self, config: ScraperConfig | None = None):
        self.config = config or ScraperConfig.from_env()
        self.scraper = JobSpyScraper(self.config)
        self.producer = KafkaJobProducer(self.config)
        self.producer.initialize()
        logger.success("RATSProducerApp initialized")

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
        terms_to_process = search_terms or self.config.search_terms
        logger.info(f"Processing {len(terms_to_process)} search terms")

        for search_term in terms_to_process:
            result = ScrapeProducerResult(search_term=search_term)
            jobs = []

            # Scrape
            try:
                jobs = self.scraper.scrape_jobs_for_term(search_term)
                result.scraped_count = len(jobs)
            except Exception as e:
                logger.error(f"Failed to scrape jobs for '{search_term}': {str(e)}")

            # Produce
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
        logger.info(f"Total jobs scraped: {stats.total_jobs_scraped}")
        logger.info(f"Total jobs produced: {stats.total_jobs_produced}")
        logger.info(f"Total jobs failed: {stats.total_jobs_failed}")
        logger.info(f"Duration: {stats.duration_seconds:.2f} seconds")
        logger.info("=" * 80)

        return stats

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.producer.close()
        logger.info("Pipeline resources cleaned up")


if __name__ == "__main__":
    with RATSProducerApp() as pipeline:
        pipeline.run()
