{{
    config(
        materialized='incremental',
        unique_key='url'
    )
}}

with news as (
    select *
    from {{ ref("stg_news") }}
    {% if is_incremental() %}
    where ingested_at >= (select coalesce(max(ingested_at), '1990-01-01') from {{ this }})
    {% endif %}
),

country_tags as (
    select *
    from {{ ref("int_news_country_tags") }}
    {% if is_incremental() %}
    where ingested_at >= (select coalesce(max(ingested_at), '1990-01-01') from {{ this }})
    {% endif %}
),

dim_date as (
    select date_day
    from {{ ref("dim_date") }}
)

select
    news.ingested_at,
    current_timestamp() as processed_at,
    news.url,
    news.feed_name,
    news.title,
    news.summary,
    news.published_at,
    dim_date.date_day,
    country_tags.country_codes
from news
inner join country_tags
    on news.url = country_tags.url
inner join dim_date
    on cast(news.published_at as date) = dim_date.date_day
