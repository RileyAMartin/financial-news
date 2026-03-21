with fx_daily as (
    select *
    from {{ ref('fct_fx') }}
)

select
    base_currency_code,
    quote_currency_code,
    source_code,
    extract(year from date_day) as date_year,
    extract(quarter from date_day) as date_quarter,
    avg(open_price) as open_price,
    avg(high_price) as high_price,
    avg(low_price) as low_price,
    avg(close_price) as period_average_rate,
    max(ingested_at) as ingested_at,
    current_timestamp() as processed_at
from fx_daily
group by
    base_currency_code,
    quote_currency_code,
    date_year,
    date_quarter,
    source_code
