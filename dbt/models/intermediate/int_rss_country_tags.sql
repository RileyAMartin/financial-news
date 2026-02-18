with news as (
    select
        link,
        lower(
            regexp_replace(concat(title, " ", coalesce(summary, "")), r"[^a-zA-Z\s]", "")
        ) as full_text
    from {{ ref("stg_rss") }}
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
    array_agg(distinct country_code ignore nulls) as country_codes
from matched_tags
group by 1