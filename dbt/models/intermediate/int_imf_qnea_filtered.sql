with qnea_indicators as (
    select
        indicator_code,
        annualization_multiplier
    from {{ ref("dim_indicators") }}
),

qnea_data as (
    select *
    from {{ ref("stg_imf_qnea") }}
),

imf_countries as (
    select country_code
    from {{ ref("dim_countries") }}
)

select
    qnea_data.*,
    qnea_indicators.annualization_multiplier
from qnea_data

inner join qnea_indicators
on qnea_data.indicator_code = qnea_indicators.indicator_code

inner join imf_countries
on qnea_data.country_code = imf_countries.country_code