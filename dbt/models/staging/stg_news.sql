{{ 
    config(
        materialized='incremental',
        unique_key='url'
    )
}}

select
    ingested_at,
    source as feed_name,
    json_value(raw_content, '$.title') as title,
    json_value(raw_content, '$.summary') as summary,
    json_value(raw_content, '$.link') as url,
    timestamp(datetime(
        cast(json_value(raw_content, '$.published_parsed[0]') as int64),
        cast(json_value(raw_content, '$.published_parsed[1]') as int64),
        cast(json_value(raw_content, '$.published_parsed[2]') as int64),
        cast(json_value(raw_content, '$.published_parsed[3]') as int64),
        cast(json_value(raw_content, '$.published_parsed[4]') as int64),
        cast(json_value(raw_content, '$.published_parsed[5]') as int64)
    )) as published_at
from {{ source('raw_data', 'rss_feeds_raw')}}

{% if is_incremental() %}
where ingested_at >= (select coalesce(max(ingested_at), '1900-01-01') from {{ this }})
{% endif %}

qualify row_number() over (
    partition by url
    order by published_at desc
) = 1