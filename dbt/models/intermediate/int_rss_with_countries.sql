with cleaned_rss as (
    select
        link,
        lower(regexp_replace(title, "[^a-zA-Z\\s]", "")) as cleaned_title,
        lower(regexp_replace(summary, "[^a-zA-Z\\s]", "")) as cleaned_summary,
    from {{ ref("stg_rss") }}
),

country_keywords as (
    select
        country_code as country_id,
        keyword
    from {{ ref("country_keywords") }}
),

rss as (
    select *
    from {{ ref("stg_rss") }}
)

select
    rss.*
