{{
    config(
        materialized="incremental",
        table_format="iceberg",
        partition_by=["part_date"],
        incremental_strategy="merge",
        unique_key="job_snapshot_id",
    )
}}

with
    cte__source as (
        select
            part_date,
            job_snapshot_id,
            job_id,
            site,
            search_term,
            company_name,
            company_industry,
            location,
            is_remote,
            job_title,
            job_type,
            job_level,
            job_function,
            date_posted,
            description as job_description,
            job_url,
            job_url_direct,
            company_url,
            kafka_timestamp as inserted_at
        from {{ ref("int_linkedin__jobs_posting") }}
    )

select *
from cte__source

{% if is_incremental() %}
    where
        part_date
        >= (select coalesce(max(part_date), cast('1900-01-01' as date)) from {{ this }})
{% endif %}
