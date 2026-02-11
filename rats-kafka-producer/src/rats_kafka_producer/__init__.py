"""Public interface for the RATS Kafka producer package."""

__version__ = "0.1.0"
__author__ = "RATS Team"

from rats_kafka_producer.config.settings import ScraperConfig
from rats_kafka_producer.pipeline import RATSProducerApp
from rats_kafka_producer.sinks.kafka import KafkaJobProducer
from rats_kafka_producer.sources.linkedin import JobSpyScraper

__all__ = [
    "JobSpyScraper",
    "KafkaJobProducer",
    "RATSProducerApp",
    "ScraperConfig",
]
