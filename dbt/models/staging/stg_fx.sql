{{
    config(
        materialized="incremental",
        unique_key=["date_day", "base_currency_code", "quote_currency_code"]
    )
}}

with raw_fx as (
    select
        'YAHOO_FINANCE_FX' as source_code,
        cast(date_day as date) as date_day,
        upper(base_currency_code) as base_currency_code,
        upper(quote_currency_code) as quote_currency_code,
        cast(open_price as float64) as open_price,
        cast(high_price as float64) as high_price,
        cast(low_price as float64) as low_price,
        cast(close_price as float64) as close_price,
        ingested_at
    from {{ source('raw_data', 'fx_raw') }}
    where
        date_day is not null
        and base_currency_code is not null
        and quote_currency_code is not null
        and close_price is not null
        and upper(quote_currency_code) = 'USD'

    {% if is_incremental() %}
        and ingested_at > (select coalesce(max(ingested_at), timestamp('1990-01-01')) from {{ this }})
    {% endif %}
)

select *
from raw_fx
qualify row_number() over (
    partition by date_day, base_currency_code, quote_currency_code
    order by ingested_at desc
) = 1