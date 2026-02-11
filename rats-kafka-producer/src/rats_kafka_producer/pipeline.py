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
        logger.success("RATSProducerApp initialized")

    def run(
        self,
        search_terms: list[str] | None = None,
        produce_to_kafka: bool = True,
    ) -> PipelineStats:
        """Run the complete pipeline: scrape jobs and produce to Kafka."""
        logger.info("Starting Job Scraper Pipeline")
        effective_hours_old = self.config.hours_old

        if produce_to_kafka:
            self.producer.initialize()
            if self.producer.topic_created_on_initialize:
                effective_hours_old = None
                logger.info("Topic was initialized on this run. Skipping hours_old filter for first bootstrap scrape.")

        stats = PipelineStats()
        terms_to_process = search_terms or self.config.search_terms
        logger.info(f"Processing {len(terms_to_process)} search terms")

        for search_term in terms_to_process:
            result = ScrapeProducerResult(search_term=search_term)
            jobs = []

            # Scrape
            try:
                jobs = self.scraper.scrape_jobs_for_term(search_term, hours_old=effective_hours_old)
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
        stats.print_pretty()
        return stats

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.producer.close()
        logger.info("Pipeline resources cleaned up")
