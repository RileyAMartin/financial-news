with news as (
    select *
    from {{ ref("stg_rss") }}
),

country_tags as (
    select *
    from {{ ref("int_rss_country_tags") }}
)

select
    news.*,
    country_tags.country_codes
from news
inner join country_tags
    on news.link = country_tags.link