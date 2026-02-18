with qnea_indicators as (
    select
        indicator_code as indicator_id,
        annualization_multiplier
    from {{ ref("imf_qnea_indicators") }}
),

qnea_data as (
    select *
    from {{ ref("stg_imf_qnea") }}
),

imf_countries as (
    select country_code as country_id
    from {{ ref("imf_country_abbreviations") }}
)

select
    qnea_data.country_id,
    qnea_data.indicator_id,
    qnea_data.period_end_date,
    qnea_data.frequency,
    qnea_data.obs_value,
    qnea_data.ingested_at,
    qnea_data.is_inflation_adjusted,
    qnea_indicators.annualization_multiplier,
    'IMF_QNEA' as source_id
from qnea_data

inner join qnea_indicators
on qnea_data.indicator_id = qnea_indicators.indicator_id

inner join imf_countries
on qnea_data.country_id = imf_countries.country_id