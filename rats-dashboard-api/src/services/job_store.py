"""Neon (PostgreSQL) read access to the jobs table."""

from __future__ import annotations

from typing import Any

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from ..config import DETAIL_COLUMNS, LIST_COLUMNS, require_env
from ..schemas import JobRecord

POOL_MAX_SIZE = 3

LIST_SELECT = ", ".join(LIST_COLUMNS)
DETAIL_SELECT = ", ".join(DETAIL_COLUMNS)


def _to_record(row: dict[str, Any]) -> JobRecord:
    return JobRecord(
        point_id=row["job_hash_id"],
        job_snapshot_id=row["job_hash_id"],
        job_id=row.get("job_id"),
        job_title=row.get("job_title"),
        company_name=row.get("company_name"),
        location=row.get("location"),
        job_url=row.get("job_url"),
        payload=row,
    )


class JobStore:
    """
    Reads job rows from Neon.

    Use Neon's pooled (-pooler) connection string. A small client-side pool keeps warm connections so requests skip the
    TCP/TLS/auth handshake.
    """

    def __init__(self) -> None:
        self._pool = ConnectionPool(
            require_env("DATABASE_URL"),
            min_size=1,
            max_size=POOL_MAX_SIZE,
            kwargs={"row_factory": dict_row, "autocommit": True, "connect_timeout": 15},
            check=ConnectionPool.check_connection,
            open=True,
        )

    def _query(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        with self._pool.connection() as connection:
            return connection.execute(sql, params).fetchall()

    def list_jobs(self, limit: int, offset: int, include_description: bool = False) -> tuple[list[JobRecord], int]:
        """Return a newest-first page of jobs and the total row count, optionally with descriptions."""
        columns = DETAIL_SELECT if include_description else LIST_SELECT
        rows = self._query(
            f"""
            select {columns} from rats.linkedin_jobs
            order by date_posted desc nulls last, inserted_at desc, job_hash_id
            limit %s offset %s
            """,
            (limit, offset),
        )
        total = self._query("select count(*) as total from rats.linkedin_jobs")[0]["total"]
        return [_to_record(row) for row in rows], total

    def get_job(self, job_hash_id: str) -> JobRecord | None:
        """Return one job including its description."""
        rows = self._query(f"select {DETAIL_SELECT} from rats.linkedin_jobs where job_hash_id = %s", (job_hash_id,))
        return _to_record(rows[0]) if rows else None

    def get_jobs(self, job_hash_ids: list[str]) -> dict[str, JobRecord]:
        """Return jobs (with descriptions) keyed by job_hash_id."""
        if not job_hash_ids:
            return {}
        rows = self._query(
            f"select {DETAIL_SELECT} from rats.linkedin_jobs where job_hash_id = any(%s)", (job_hash_ids,)
        )
        return {row["job_hash_id"]: _to_record(row) for row in rows}
