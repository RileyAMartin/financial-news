SELECT
    source as feed_name,
    json_value(raw_content, '$.title') as title,
    json_value(raw_content, '$.summary') as summary,
    json_value(raw_content, '$.published') as published_at,
    ingested_at
FROM {{ source('raw_rss_data', 'rss_feeds_raw') }}