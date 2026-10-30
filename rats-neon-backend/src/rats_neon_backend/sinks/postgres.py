"""Neon (PostgreSQL) sink: upserts job listings, purges expired rows and tracks pipeline runs."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import date, timedelta
from typing import Any, Iterable, Iterator

import psycopg
from psycopg.rows import dict_row
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from rats_neon_backend.config.models import JobListing, PipelineStats
from rats_neon_backend.config.settings import ScraperConfig
from rats_neon_backend.config.utils import logger

JOB_COLUMNS = (
    "job_hash_id",
    "job_id",
    "site",
    "search_term",
    "company_name",
    "company_industry",
    "company_url",
    "location",
    "is_remote",
    "date_posted",
    "job_title",
    "job_type",
    "job_level",
    "job_function",
    "job_description",
    "job_url",
    "job_url_direct",
    "compensation_interval",
    "salary_min_amount",
    "salary_max_amount",
    "salary_currency",
    "part_date",
    "inserted_at",
)
UPDATE_COLUMNS = tuple(column for column in JOB_COLUMNS if column != "job_hash_id")

UPSERT_SQL = f"""
    insert into rats.linkedin_jobs ({", ".join(JOB_COLUMNS)})
    values ({", ".join(f"%({c})s" if c != "inserted_at" else "coalesce(%(inserted_at)s, now())" for c in JOB_COLUMNS)})
    on conflict (job_hash_id) do update set {", ".join(f"{c} = excluded.{c}" for c in UPDATE_COLUMNS)}
"""


def _chunks(items: list[Any], size: int) -> Iterable[list[Any]]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


class PostgresJobSink:
    """
    Persists job listings to Neon. Opens a short-lived connection per operation.

    Neon suspends idle compute and drops connections, and scraping is slow, so a long-lived connection would go stale.
    """

    def __init__(self, config: ScraperConfig):
        self.config = config.database
        if not self.config.url:
            raise RuntimeError("DATABASE_URL is required to write jobs.")
        self._with_retry = retry(
            stop=stop_after_attempt(config.retry.max_attempts),
            wait=wait_exponential(min=config.retry.wait_min, max=config.retry.wait_max),
            retry=retry_if_exception_type(psycopg.OperationalError),
            before_sleep=before_sleep_log(logger, "WARNING"),
            reraise=True,
        )

    @contextmanager
    def _cursor(self) -> Iterator[psycopg.Cursor]:
        with psycopg.connect(self.config.url, row_factory=dict_row, autocommit=True) as connection:
            with connection.cursor() as cursor:
                yield cursor

    def _execute(self, sql: str, params: Any = None) -> list[dict[str, Any]]:
        def run() -> list[dict[str, Any]]:
            with self._cursor() as cursor:
                cursor.execute(sql, params)
                return cursor.fetchall() if cursor.description else []

        return self._with_retry(run)()

    def is_empty(self) -> bool:
        """Return True when no job has been stored yet (first bootstrap run)."""
        return not self._execute("select 1 from rats.linkedin_jobs limit 1")

    def upsert_jobs(self, jobs: list[JobListing]) -> int:
        """
        Upsert jobs keyed by job_hash_id.

        Returns the number of unique rows written.
        """
        rows = list({job.job_hash_id: job.to_row() for job in jobs}.values())
        self.upsert_rows(rows)
        logger.info(f"Upserted {len(rows)} unique jobs ({len(jobs) - len(rows)} duplicates collapsed)")
        return len(rows)

    def upsert_rows(self, rows: list[dict[str, Any]]) -> int:
        """Upsert pre-built table rows (also used by the Qdrant backfill)."""
        for batch in _chunks(rows, self.config.upsert_batch_size):
            params = [{column: row.get(column) for column in JOB_COLUMNS} for row in batch]

            def run(params: list[dict[str, Any]] = params) -> None:
                with self._cursor() as cursor:
                    cursor.executemany(UPSERT_SQL, params)

            self._with_retry(run)()
        return len(rows)

    def purge_expired(self) -> list[str]:
        """Delete rows older than the retention window and return their hash ids."""
        cutoff = date.today() - timedelta(days=self.config.retention_days)
        rows = self._execute(
            """
            delete from rats.linkedin_jobs
            where date_posted < %(cutoff)s or (date_posted is null and part_date < %(cutoff)s)
            returning job_hash_id
            """,
            {"cutoff": cutoff},
        )
        logger.info(f"Purged {len(rows)} jobs older than {cutoff}")
        return [row["job_hash_id"] for row in rows]

    def fetch_pending_embedding(self, limit: int) -> list[dict[str, Any]]:
        """Return rows that have not been embedded into Qdrant yet."""
        return self._execute(
            """
            select job_hash_id, company_name, job_title, job_description, job_level
            from rats.linkedin_jobs
            where embedded_at is null
            order by inserted_at
            limit %s
            """,
            (limit,),
        )

    def mark_embedded(self, hashes: list[str]) -> None:
        """Stamp rows as embedded so they are not processed again."""
        self._execute("update rats.linkedin_jobs set embedded_at = now() where job_hash_id = any(%s)", (hashes,))

    def reset_embedded(self) -> None:
        """Clear embedded_at on every row, forcing a full re-embed on the next run."""
        self._execute("update rats.linkedin_jobs set embedded_at = null")

    def start_run(self) -> str | None:
        """
        Insert a pipeline_runs row and return its id.

        Logging failures never abort the run.
        """
        try:
            rows = self._execute("insert into rats.pipeline_runs default values returning run_id")
            return str(rows[0]["run_id"])
        except Exception as error:
            logger.warning(f"Could not record pipeline run start: {error}")
            return None

    def finish_run(self, run_id: str | None, stats: PipelineStats) -> None:
        """Close the pipeline_runs row with final counters and status."""
        if run_id is None:
            return
        try:
            self._execute(
                """
                update rats.pipeline_runs
                set finished_at = now(), status = %s, jobs_scraped = %s, jobs_upserted = %s,
                    jobs_embedded = %s, jobs_purged = %s, error = %s
                where run_id = %s
                """,
                (
                    "success" if stats.succeeded else "failed",
                    stats.total_jobs_scraped,
                    stats.total_jobs_upserted,
                    stats.total_jobs_embedded,
                    stats.total_jobs_purged,
                    "; ".join(stats.errors)[:2000] or None,
                    run_id,
                ),
            )
        except Exception as error:
            logger.warning(f"Could not record pipeline run result: {error}")
