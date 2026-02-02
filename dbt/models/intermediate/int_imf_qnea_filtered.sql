with qnea_indicators as (
    select indicator_code
    from {{ ref("imf_qnea_indicators") }}
),

qnea_data as (
    select *
    from {{ ref("stg_imf_qnea") }}
)

select
    qnea_data.country_code,
    qnea_data.indicator_code,
    qnea_data.time_period,
    qnea_data.obs_value,
    qnea_data.is_inflation_adjusted
from qnea_data

inner join qnea_indicators
on qnea_data.indicator_code = qnea_indicators.indicator_code