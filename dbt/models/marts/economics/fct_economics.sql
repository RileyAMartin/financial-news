select
    {{ dbt_utils.generate_surrogate_key(["country_code", "indicator_code", "period_end_date"]) }} as fact_id,
    country_code,
    indicator_code,
    source_code,
    period_end_date,
    frequency,
    is_inflation_adjusted,
    value_local,
    value_usd,
    value_eur
from {{ ref("int_imf_qnea_with_fx") }}