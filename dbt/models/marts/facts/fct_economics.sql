with qnea as (
    select *
    from {{ ref('int_imf_qnea_filtered') }}
),

country_currency as (
    select
        country_code,
        currency_code
    from {{ ref('dim_countries') }}
)

select
    qnea.country_code,
    country_currency.currency_code,
    qnea.source_code,
    qnea.indicator_code,
    dim_date.date_day,
    qnea.frequency,
    qnea.is_inflation_adjusted,
    qnea.ingested_at,
    current_timestamp() as processed_at,
    (qnea.obs_value * qnea.annualization_multiplier) as value_local
from qnea
inner join {{ ref('dim_date') }} as dim_date
    on qnea.period_end_date = dim_date.date_day
inner join country_currency
    on qnea.country_code = country_currency.country_code