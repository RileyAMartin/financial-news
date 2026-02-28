{{ 
    config(
        materialized='incremental',
        unique_key=['country_code', 'indicator_code', 'period_end_date', 'is_inflation_adjusted']
    )
}}

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

{% if is_incremental() %}
where ingested_at > (select coalesce(max(ingested_at), '1900-01-01') from {{ this }})
{% endif %}