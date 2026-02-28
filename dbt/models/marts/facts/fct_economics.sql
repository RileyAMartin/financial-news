select
    country_code,
    source_code,
    indicator_code,
    period_end_date,
    frequency,
    is_inflation_adjusted,
    ingested_at,
    value_local,
    value_usd,
    value_eur
from {{ ref("int_imf_qnea_with_fx") }}