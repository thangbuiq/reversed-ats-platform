-- Run once against the Neon database (SQL editor or `psql "$DATABASE_URL" -f sql/001_init.sql`).
-- Dedicated schema keeps these tables out of ORMs/migration tools that manage `public`.
create schema if not exists rats;

create table if not exists rats.linkedin_jobs (
    -- md5(company || title || description || level): same key the dbt mart used for
    -- dedup
    job_hash_id text primary key,
    job_id text not null,
    site text,
    search_term text,
    company_name text,
    company_industry text,
    company_url text,
    location text,
    is_remote boolean,
    date_posted date,
    job_title text,
    job_type text,
    job_level text,
    job_function text,
    job_description text,
    job_url text,
    job_url_direct text,
    compensation_interval text,
    salary_min_amount double precision,
    salary_max_amount double precision,
    salary_currency text,
    part_date date not null,
    inserted_at timestamptz not null default now(),
    -- null until the row has been embedded into Qdrant
    embedded_at timestamptz
);

create index if not exists linkedin_jobs_date_posted_idx
    on rats.linkedin_jobs (date_posted desc nulls last, inserted_at desc);
create index if not exists linkedin_jobs_job_level_idx on rats.linkedin_jobs (job_level);
create index if not exists linkedin_jobs_pending_embed_idx
    on rats.linkedin_jobs (inserted_at) where embedded_at is null;

create table if not exists rats.pipeline_runs (
    run_id uuid primary key default gen_random_uuid(),
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    status text not null default 'running' check (status in ('running', 'success', 'failed')),
    jobs_scraped integer not null default 0,
    jobs_upserted integer not null default 0,
    jobs_embedded integer not null default 0,
    jobs_purged integer not null default 0,
    error text
);
