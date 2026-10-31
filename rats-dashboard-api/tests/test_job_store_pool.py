"""Tests that JobStore reuses pooled connections instead of connecting per query."""

from unittest.mock import MagicMock, patch

from src.services.job_store import POOL_MAX_SIZE, JobStore


def test_store_builds_a_bounded_pool_once(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pw@host-pooler/db")
    with patch("src.services.job_store.ConnectionPool") as pool_cls:
        pool = pool_cls.return_value
        connection = MagicMock()
        connection.execute.return_value.fetchall.return_value = [{"job_hash_id": "abc"}]
        pool.connection.return_value.__enter__.return_value = connection

        store = JobStore()
        store._query("select 1")
        store._query("select 2")

    assert pool_cls.call_count == 1
    assert pool_cls.call_args.kwargs["max_size"] == POOL_MAX_SIZE
    assert pool.connection.call_count == 2
