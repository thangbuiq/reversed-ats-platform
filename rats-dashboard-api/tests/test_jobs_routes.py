"""Tests for the job detail route's caching behaviour."""

from unittest.mock import patch

from fastapi.testclient import TestClient
from src.main import app
from src.routes.jobs import JOB_DETAIL_CACHE_CONTROL
from src.schemas import JobRecord

client = TestClient(app)


class FakeStore:
    """Returns one known job and nothing else."""

    def get_job(self, job_hash_id: str) -> JobRecord | None:
        if job_hash_id != "abc":
            return None
        return JobRecord(
            point_id="abc",
            job_snapshot_id="abc",
            job_id="1",
            job_title="Engineer",
            company_name="Acme",
            location="Remote",
            job_url=None,
            payload={"job_description": "text"},
        )


def test_job_detail_is_cacheable_at_the_cdn() -> None:
    with patch("src.routes.jobs.get_job_store", return_value=FakeStore()):
        response = client.get("/jobs/abc")

    assert response.status_code == 200
    assert response.headers["cache-control"] == JOB_DETAIL_CACHE_CONTROL


def test_missing_job_is_not_cached() -> None:
    with patch("src.routes.jobs.get_job_store", return_value=FakeStore()):
        response = client.get("/jobs/missing")

    assert response.status_code == 404
    assert "s-maxage" not in response.headers.get("cache-control", "")
