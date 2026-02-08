with qnea_indicators as (
    select indicator_code, annualization_multiplier
    from {{ ref("imf_qnea_indicators") }}
),

qnea_data as (
    select *
    from {{ ref("stg_imf_qnea") }}
),

imf_countries as (
    select country_code
    from {{ ref("imf_country_abbreviations") }}
)

select
    qnea_data.country_code,
    qnea_data.indicator_code,
    qnea_data.period_end_date,
    qnea_data.frequency,
    qnea_data.obs_value,
    qnea_data.is_inflation_adjusted,
    qnea_indicators.annualization_multiplier,
    'IMF_QNEA' as source_code
from qnea_data

inner join qnea_indicators
on qnea_data.indicator_code = qnea_indicators.indicator_code

inner join imf_countries
on qnea_data.country_code = imf_countries.country_code