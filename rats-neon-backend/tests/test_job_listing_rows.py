"""Tests for the Neon row mapping and dedup key."""

import uuid

from rats_neon_backend.backfill import payload_to_row
from rats_neon_backend.config.models import JobListing, compute_job_hash_id
from rats_neon_backend.sinks.qdrant import build_embedding_text, point_id


def test_job_hash_matches_dbt_dedup_key() -> None:
    """Md5 of company||title||description||level, with nulls coalesced to empty strings."""
    assert compute_job_hash_id("a", "b", None, "c") == compute_job_hash_id("a", "b", "", "c")
    assert compute_job_hash_id("a", "b", "d", "c") != compute_job_hash_id("a", "b", "x", "c")


def test_job_hash_is_stable_across_scrapes() -> None:
    """Re-scraping the same posting yields a new job_id but the same hash."""
    first = JobListing(company="Acme", title="DE", description="text", job_level="mid", search_term="de")
    second = JobListing(company="Acme", title="DE", description="text", job_level="mid", search_term="de")
    assert first.job_id != second.job_id
    assert first.job_hash_id == second.job_hash_id


def test_to_row_maps_columns_and_normalizes_dates() -> None:
    listing = JobListing(
        title="DE", company="Acme", date_posted="2026-10-29", min_amount=10.0, ingestion_date="2026-10-30"
    )
    row = listing.to_row()
    assert row["job_title"] == "DE"
    assert row["company_name"] == "Acme"
    assert row["date_posted"] == "2026-10-29"
    assert row["part_date"] == "2026-10-30"
    assert row["salary_min_amount"] == 10.0
    assert "embedded_at" not in row


def test_to_row_drops_unparseable_date() -> None:
    assert JobListing(date_posted="yesterday").to_row()["date_posted"] is None


def test_point_id_is_valid_uuid_of_hash() -> None:
    job_hash = compute_job_hash_id("a", "b", "c", "d")
    assert uuid.UUID(point_id(job_hash)).hex == job_hash


def test_embedding_text_uses_fixed_field_order() -> None:
    row = {"job_level": "mid", "company_name": "Acme", "job_title": "DE", "job_description": None}
    assert build_embedding_text(row) == "company_name: Acme\njob_title: DE\njob_level: mid"


def test_payload_to_row_rebuilds_hash_and_skips_undated() -> None:
    payload = {"company_name": "Acme", "job_title": "DE", "job_description": "d", "job_level": "mid"}
    assert payload_to_row(payload) is None
    row = payload_to_row({**payload, "part_date": "2026-10-01", "date_posted": "2026-09-30"})
    assert row is not None
    assert row["job_hash_id"] == compute_job_hash_id("Acme", "DE", "d", "mid")
    assert row["part_date"] == "2026-10-01"
