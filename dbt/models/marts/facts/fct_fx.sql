{{
    config(
        materialized='incremental',
        unique_key=['base_currency_code', 'quote_currency_code', 'date_day']
    )
}}

with fx_daily as (
    select *
    from {{ ref('stg_fx') }}
)

select
    fx_daily.base_currency_code,
    fx_daily.quote_currency_code,
    fx_daily.date_day,
    fx_daily.open_price,
    fx_daily.high_price,
    fx_daily.low_price,
    fx_daily.close_price,
    fx_daily.ingested_at,
    fx_daily.source_code,
    current_timestamp() as processed_at
from fx_daily
inner join {{ ref('dim_date') }} as dim_date
    on fx_daily.date_day = dim_date.date_day

{% if is_incremental() %}
where fx_daily.ingested_at > (select coalesce(max(ingested_at), timestamp('1990-01-01')) from {{ this }})
{% endif %}
