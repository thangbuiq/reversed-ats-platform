"""Tests for Kafka header and payload behavior on JobListing."""

import uuid

from rats_kafka_producer.config.models import JobListing


def test_job_listing_payload_and_headers() -> None:
    """JobListing keeps ingestion metadata in headers, not payload."""
    listing = JobListing(search_term="data engineer")

    avro_payload = listing.to_avro_dict()
    assert "ingestion_timestamp" not in avro_payload
    assert "ingestion_date" not in avro_payload

    headers = dict(listing.to_kafka_headers())
    assert headers["kafka_job_id"] == listing.job_id
    assert headers["kafka_ingestion_timestamp"] == str(listing.ingestion_timestamp)
    assert headers["kafka_ingestion_date"] == listing.ingestion_date
    assert all(key.startswith("kafka_") for key in headers)


def test_job_listing_enforces_uuid_for_job_id() -> None:
    """Invalid job_id input is replaced by a generated UUID."""
    listing = JobListing(job_id="not-a-uuid", search_term="ml engineer")
    uuid.UUID(listing.job_id)
    assert listing.job_id != "not-a-uuid"
    assert isinstance(uuid.UUID(listing.job_id), uuid.UUID)
