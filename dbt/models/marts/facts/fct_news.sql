{{ config(
    materialized='incremental',
    unique_key='link'
)}}

with news as (
    select *
    from {{ ref("stg_rss") }}

    {% if is_incremental() %}
    where published_at > (select max(published_at) from {{ this }})
    {% endif %}
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