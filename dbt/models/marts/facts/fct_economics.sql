{{ 
    config(
        materialized='incremental',
        unique_key=['country_code', 'currency_code', 'indicator_code', 'date_day', 'is_inflation_adjusted']
    )
}}

with qnea as (
    select *
    from {{ ref('int_imf_qnea_filtered') }}

    {% if is_incremental() %}
    where ingested_at > (select coalesce(max(ingested_at), '1900-01-01') from {{ this }})
    {% endif %}
),

country_currency as (
    select
        country_code,
        currency_code
    from {{ ref('dim_currencies') }}
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
    (qnea.obs_value * qnea.annualization_multiplier) as value_local
from qnea
inner join {{ ref('dim_date') }} as dim_date
    on qnea.period_end_date = dim_date.date_day
left join country_currency
    on qnea.country_code = country_currency.country_code