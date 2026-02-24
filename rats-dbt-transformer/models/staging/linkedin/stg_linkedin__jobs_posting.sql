with
    cte__source as (select * from {{ source("linkedin", "rats_jobs_listing_v1") }}),
    cte__final as (
        select
            part_date,
            kafka_event_id,
            kafka_timestamp,
            kafka_headers,
            kafka_payload,
            kafka_topic,
            kafka_offset,
            kafka_partition
        from cte__source
    )

select *
from cte__final
