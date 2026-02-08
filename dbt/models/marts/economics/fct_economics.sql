select
    {{ dbt_utils.generate_surrogate_key(["country_id", "indicator_id", "period_end_date", "source_id"]) }} as fact_id,
    country_id,
    source_id,
    {{ dbt_utils.generate_surrogate_key(["indicator_id"]) }} as indicator_id,
    period_end_date,
    frequency,
    is_inflation_adjusted,
    value_local,
    value_usd,
    value_eur
from {{ ref("int_imf_qnea_with_fx") }}