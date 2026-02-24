with
    cte__source as (select * from {{ ref("stg_linkedin__jobs_posting") }}),
    cte__deduplicated as (
        select
            *,
            row_number() over (
                partition by kafka_payload.job_id, part_date
                order by kafka_timestamp desc, kafka_offset desc
            ) as record_rank
        from cte__source
    )

select
    md5(
        concat_ws('||', coalesce(kafka_payload.job_id, ''), cast(part_date as string))
    ) as job_snapshot_id,
    cast(kafka_event_id as string) as kafka_event_id,
    cast(kafka_timestamp as timestamp) as kafka_timestamp,
    cast(part_date as date) as part_date,
    cast(kafka_topic as string) as kafka_topic,
    cast(kafka_partition as int) as kafka_partition,
    cast(kafka_offset as bigint) as kafka_offset,
    cast(kafka_payload.site as string) as site,
    cast(kafka_payload.search_term as string) as search_term,
    cast(kafka_payload.job_id as string) as job_id,
    cast(kafka_payload.job.job_url as string) as job_url,
    cast(kafka_payload.job.job_url_direct as string) as job_url_direct,
    cast(kafka_payload.job.title as string) as job_title,
    cast(kafka_payload.job.company as string) as company_name,
    cast(kafka_payload.job.location as string) as location,
    cast(kafka_payload.job.job_type as string) as job_type,
    cast(kafka_payload.job.date_posted as date) as date_posted,
    cast(kafka_payload.job.is_remote as boolean) as is_remote,
    cast(kafka_payload.job.job_level as string) as job_level,
    cast(kafka_payload.job.job_function as string) as job_function,
    cast(kafka_payload.job.listing_type as string) as listing_type,
    cast(kafka_payload.job.emails as string) as emails,
    cast(kafka_payload.job.description as string) as description,
    cast(kafka_payload.compensation.interval as string) as compensation_interval,
    cast(kafka_payload.compensation.min_amount as double) as salary_min_amount,
    cast(kafka_payload.compensation.max_amount as double) as salary_max_amount,
    case
        when
            kafka_payload.compensation.min_amount is null
            or kafka_payload.compensation.max_amount is null
        then null
        else
            (
                kafka_payload.compensation.min_amount
                + kafka_payload.compensation.max_amount
            )
            / 2
    end as salary_mid_amount,
    cast(kafka_payload.compensation.currency as string) as salary_currency,
    cast(kafka_payload.company_details.company_industry as string) as company_industry,
    cast(kafka_payload.company_details.company_url as string) as company_url,
    cast(
        kafka_payload.company_details.company_url_direct as string
    ) as company_url_direct,
    cast(
        kafka_payload.company_details.company_addresses as string
    ) as company_addresses,
    cast(
        kafka_payload.company_details.company_num_employees as int
    ) as company_num_employees,
    cast(kafka_payload.company_details.company_revenue as string) as company_revenue,
    cast(
        kafka_payload.company_details.company_description as string
    ) as company_description,
    cast(kafka_payload.company_details.logo_photo_url as string) as logo_photo_url,
    cast(kafka_payload.company_details.banner_photo_url as string) as banner_photo_url,
    cast(kafka_payload.company_details.ceo_name as string) as ceo_name,
    cast(kafka_payload.company_details.ceo_photo_url as string) as ceo_photo_url
from cte__deduplicated
where record_rank = 1
