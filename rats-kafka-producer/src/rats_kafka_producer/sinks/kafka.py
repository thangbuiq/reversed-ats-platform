"""Kafka producer for Avro-encoded job listings."""

import json

from confluent_kafka import KafkaException, Producer
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer
from confluent_kafka.serialization import MessageField, SerializationContext
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
from rats_kafka_producer.schema import get_job_listing_schema


class KafkaJobProducer:
    """Kafka producer that publishes job listings with Avro serialization."""

    def __init__(self, config: ScraperConfig):
        self.config = config
        self._producer: Producer | None = None
        self._avro_serializer: AvroSerializer | None = None
        self._is_initialized = False

    def initialize(self) -> None:
        """Initialize Kafka producer and schema registry."""
        if self._is_initialized:
            return

        # Configure Schema Registry client with authentication
        schema_registry_conf = {"url": self.config.kafka.schema_registry_url}

        # Add authentication if credentials are provided
        if self.config.kafka.schema_registry_api_key and self.config.kafka.schema_registry_api_secret:
            schema_registry_conf["basic.auth.user.info"] = (
                f"{self.config.kafka.schema_registry_api_key}:{self.config.kafka.schema_registry_api_secret}"
            )

        schema_registry_client = SchemaRegistryClient(schema_registry_conf)

        # Create Avro serializer
        self._avro_serializer = AvroSerializer(
            schema_registry_client=schema_registry_client,
            schema_str=json.dumps(get_job_listing_schema()),
        )

        # Configure Kafka producer
        producer_conf = {"bootstrap.servers": self.config.kafka.bootstrap_servers}

        if self.config.kafka.client_id:
            producer_conf["client.id"] = self.config.kafka.client_id

        # Add SASL authentication for Confluent Cloud if credentials are provided
        if self.config.kafka.api_key and self.config.kafka.api_secret:
            producer_conf.update(
                {
                    "security.protocol": "SASL_SSL",
                    "sasl.mechanisms": "PLAIN",
                    "sasl.username": self.config.kafka.api_key,
                    "sasl.password": self.config.kafka.api_secret,
                }
            )

        # Ensure topic exists
        self._ensure_topic_exists(producer_conf)

        self._producer = Producer(producer_conf)
        self._is_initialized = True
        logger.info("Kafka producer initialized successfully")

    def _ensure_topic_exists(self, conf: dict) -> None:
        """Create Kafka topic if it doesn't exist."""
        topic_name = self.config.kafka.topic
        # Create a copy of conf to avoid modifying the original if AdminClient modifies it
        admin_conf = conf.copy()
        admin_client = AdminClient(admin_conf)

        try:
            # Check if topic exists
            cluster_metadata = admin_client.list_topics(timeout=10)
            if topic_name in cluster_metadata.topics:
                logger.info(f"Topic '{topic_name}' already exists")
                return
        except Exception as e:
            logger.warning(f"Could not check if topic exists (will try to produce anyway): {e}")
            return

        logger.info(f"Topic '{topic_name}' not found. Attempting to create it...")
        new_topic = NewTopic(topic_name, num_partitions=1, replication_factor=3)

        try:
            futures = admin_client.create_topics([new_topic])
            for topic, future in futures.items():
                try:
                    future.result()  # Wait for result
                    logger.info(f"Topic '{topic}' created successfully")
                except Exception as e:
                    logger.error(f"Failed to create topic '{topic}': {e}")
        except Exception as e:
            logger.error(f"Error during topic creation: {e}")

    def _delivery_report(self, err, msg):
        """Callback for message delivery reports."""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.info(f"Message delivered to {msg.topic()} [partition {msg.partition()}] at offset {msg.offset()}")

    def _create_retry_decorator(self):
        """Create retry decorator for Kafka operations."""
        return retry(
            stop=stop_after_attempt(self.config.retry.max_attempts),
            wait=wait_exponential(
                min=self.config.retry.wait_min,
                max=self.config.retry.wait_max,
            ),
            retry=retry_if_exception_type(KafkaException),
            before_sleep=before_sleep_log(logger, "WARNING"),
        )

    def produce_job(self, job: JobListing) -> None:
        """Produce a single job to Kafka."""
        if not self._is_initialized:
            self.initialize()

        @self._create_retry_decorator()
        def _produce():
            avro_data = job.to_avro_dict()

            serialized_value = self._avro_serializer(
                avro_data,
                SerializationContext(self.config.kafka.topic, MessageField.VALUE),
            )

            self._producer.produce(
                topic=self.config.kafka.topic,
                key=job.job_id.encode("utf-8"),
                value=serialized_value,
                callback=self._delivery_report,
            )

            self._producer.poll(0)

        try:
            _produce()
            logger.info(f"Produced job: {job.job_id}")
        except ValueError as ve:
            # Avro schema mismatch - data bug, not transient
            logger.warning(f"Skipping job (schema validation failed): {str(ve)} | job_id={job.job_id}")
            raise
        except Exception as e:
            logger.error(f"Error producing job to Kafka: {str(e)}")
            raise

    def produce_jobs_batch(
        self,
        jobs: list[JobListing],
    ) -> tuple[int, int]:
        """Produce a batch of jobs to Kafka."""
        if not self._is_initialized:
            self.initialize()

        successful = 0
        failed = 0

        search_term = jobs[0].search_term if jobs else "unknown"
        logger.info(f"Producing {len(jobs)} jobs to Kafka for search term '{search_term}'")

        for job in jobs:
            try:
                self.produce_job(job)
                successful += 1
            except Exception as e:
                logger.error(f"Failed to produce job after retries: {str(e)}")
                failed += 1

        # Flush producer
        remaining = self._producer.flush(timeout=30)
        if remaining > 0:
            logger.warning(f"{remaining} messages were not delivered")
            failed += remaining

        logger.info(f"Batch production complete. Successful: {successful}, Failed: {failed}")

        return successful, failed

    def close(self) -> None:
        """Close Kafka producer connection."""
        if self._producer:
            self._producer.flush()
            logger.info("Kafka producer closed")

    def __enter__(self):
        self.initialize()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
