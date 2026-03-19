with fx_daily as (
    select *
    from {{ ref('stg_fx') }}
),

fx_with_calendar as (
    select
        fx_daily.base_currency_code,
        fx_daily.quote_currency_code,
        dim_date.year_quarter,
        dim_date.year,
        dim_date.quarter,
        dim_date.financial_year,
        dim_date.financial_quarter,
        fx_daily.date_day,
        fx_daily.close_price
    from fx_daily
    inner join {{ ref('dim_date') }} as dim_date
        on fx_daily.date_day = dim_date.date_day
)

select
    base_currency_code,
    quote_currency_code,
    year,
    quarter,
    year_quarter,
    financial_year,
    financial_quarter,
    min(date_day) as quarter_start_date,
    max(date_day) as quarter_end_date,
    avg(close_price) as period_average_rate
from fx_with_calendar
group by
    base_currency_code,
    quote_currency_code,
    year,
    quarter,
    year_quarter,
    financial_year,
    financial_quarter