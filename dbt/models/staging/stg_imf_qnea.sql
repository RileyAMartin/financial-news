{{
    config(
        materialized="incremental",
        unique_key=["indicator_code", "period_end_date", "country_code", "is_inflation_adjusted"]
    )
}}

select
    obs_value,
    ingested_at,
    country as country_code,
    indicator as indicator_code,
    'IMF_QNEA' as source_code,
    'Q' as frequency,
    case
        when price_type = 'Q' then True
        else False
    end as is_inflation_adjusted,
    {{ parse_imf_date('time_period') }} as period_end_date
from {{ source("raw_data", "imf_qnea_raw") }}

where
    obs_value is not null
    and indicator is not null
    and time_period is not null
    and country is not null
    and price_type in ('Q', 'V')  -- Constant and current prices
    and type_of_transformation = 'XDC'  -- Local currency
    and s_adjustment = 'SA'  -- Seasonally adjusted

    {% if is_incremental() %}
    and ingested_at > (select coalesce(max(ingested_at), "1990-01-01") from {{ this }})
    {% endif %}

qualify row_number() over (
    partition by country, indicator, time_period, price_type
    order by ingested_at desc
) = 1