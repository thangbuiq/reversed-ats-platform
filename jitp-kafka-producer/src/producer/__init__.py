"""Job Market Intelligence Platform - Scraper Package."""

__version__ = "0.1.0"
__author__ = "Job Market Intelligence Team"

from producer.config.settings import ScraperConfig
from producer.pipeline import JobScraperPipeline
from producer.producers.kafka_producer import KafkaJobProducer
from producer.scrapers.jobspy_scraper import JobSpyScraper

__all__ = [
    "JobScraperPipeline",
    "JobSpyScraper",
    "KafkaJobProducer",
    "ScraperConfig",
]
