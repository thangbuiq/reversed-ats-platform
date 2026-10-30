# rats-neon-backend

Standalone replacement for `rats-kafka-producer` + `rats-kafka-consumer` + dbt + `rats-vectordb-materializer`.
It scrapes LinkedIn with JobSpy (extraction code is unchanged), upserts rows into Neon (serverless Postgres), and optionally embeds
new rows into Qdrant for the CV matcher.

```text
GitHub Actions (daily cron)
  -> JobSpy scrape (per search term)
  -> upsert  linkedin_jobs (Neon)     (key: job_hash_id)      <- dashboard reads here
  -> purge   rows older than JOB_RETENTION_DAYS
  -> embed   rows with embedded_at IS NULL -> Qdrant           <- CV matcher reads here
  -> record  pipeline_runs (Neon)
```

## Setup

1. Create a Neon project and run [`sql/001_init.sql`](sql/001_init.sql) (Neon SQL editor, or `psql "$DATABASE_URL" -f sql/001_init.sql`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the pooled Neon connection string (host contains `-pooler`, `sslmode=require`).
3. Install and run:

```bash
uv sync --extra vectors --extra dev
uv run rats-neon-backend validate
uv run rats-neon-backend run --no-write      # scrape only, no database needed
uv run rats-neon-backend run                 # scrape + Neon + Qdrant (if configured)
uv run rats-neon-backend run --no-vectors    # skip Qdrant even when configured
```

## Scheduling and manual runs

The [Daily Pipeline workflow](../.github/workflows/pipeline_daily.yml) runs at 01:00 UTC (08:00 Asia/Ho_Chi_Minh).
Run it on demand from the Actions tab ("Run workflow", optionally rebuilding the Qdrant collection) or with
`gh workflow run pipeline_daily.yml`. The README badge shows the status of the latest run on `main`.

## Qdrant

Qdrant is optional and only used by the CV upload feature. Vectors are keyed by
`uuid(job_hash_id)` and carry only `{job_hash_id}` as payload. The dashboard API hydrates matches from Neon.
A row is embedded once: `embedded_at` is stamped after the Qdrant upsert, so a Qdrant outage never loses data;
pending rows are retried on the next run.

## One-time migration from the Databricks era

```bash
uv run rats-neon-backend backfill-from-qdrant        # old payloads hold full rows -> Neon
uv run rats-neon-backend run --recreate-collection   # rebuild vectors with the new ids
```

## Tests

```bash
uv run pytest
```
