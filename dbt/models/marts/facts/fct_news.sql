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
    where ingested_at > (select coalesce(max(ingested_at), '1990-01-01') from {{ this }})
    {% endif %}
),

country_tags as (
    select *
    from {{ ref("int_news_country_tags") }}
    {% if is_incremental() %}
    where ingested_at > (select coalesce(max(ingested_at), '1900-01-01') from {{ this }})
    {% endif %}
)

select
    news.*,
    country_tags.country_codes
from news
inner join country_tags
    on news.url = country_tags.url