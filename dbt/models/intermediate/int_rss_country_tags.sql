{{
    config(
        materialized='incremental',
        unique_key='link'
    )
}}

with news as (
    select
        link,
        published_at,
        lower(
            regexp_replace(concat(title, " ", coalesce(summary, "")), r"[^a-zA-Z\s]", "")
        ) as full_text
    from {{ ref("stg_rss") }}

    {% if is_incremental() %}
    where published_at > (select max(published_at) from {{ this }})
    {% endif %}
),

keywords as (
    select distinct
        country_code,
        lower(keyword) as keyword
    from {{ ref("country_keywords") }}
),

matched_tags as (
    select
        news.link,
        news.published_at,
        keywords.country_code
    from news
    inner join keywords
        on regexp_contains(
            news.full_text,
            concat(r"\b", keywords.keyword, r"\b")
        )
)

select
    link,
    published_at,
    array_agg(distinct country_code ignore nulls) as country_codes
from matched_tags
group by 1, 2