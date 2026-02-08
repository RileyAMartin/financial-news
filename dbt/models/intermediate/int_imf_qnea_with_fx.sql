with qnea_data as (
    select *
    from {{ ref("int_imf_qnea_filtered") }}
),

fx_data as (
    select
        country_code,
        period_end_date,
        frequency,
        max(case when indicator_code = 'USD_XDC' then obs_value end) as value_usd,
        max(case when indicator_code = 'EUR_XDC' then obs_value end) as value_eur
    from {{ ref("stg_imf_fx") }}
    group by 1, 2, 3
)

select
    qnea_data.country_code,
    qnea_data.indicator_code,
    qnea_data.period_end_date,
    qnea_data.frequency,
    qnea_data.source_code,
    qnea_data.is_inflation_adjusted,
    (qnea_data.obs_value * qnea_data.annualization_multiplier) as value_local,
    (qnea_data.obs_value * qnea_data.annualization_multiplier * fx_data.value_usd) as value_usd,
    (qnea_data.obs_value * qnea_data.annualization_multiplier * fx_data.value_eur) as value_eur
from qnea_data

left join fx_data
on
    qnea_data.country_code = fx_data.country_code
    and qnea_data.period_end_date = fx_data.period_end_date
    and qnea_data.frequency = fx_data.frequency