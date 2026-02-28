{{
    config(
        materialized="incremental",
        unique_key=["country_code", "indicator_code", "period_end_date"]
    )
}}

select
    obs_value,
    ingested_at,
    frequency,
    country as country_code,
    indicator as indicator_code,
    {{ parse_imf_date('time_period') }} as period_end_date
from {{ source("raw_data", "imf_fx_raw") }}

where
    country is not null
    and obs_value is not null
    and time_period is not null
    and frequency = 'Q'
    and type_of_transformation = 'PA_RT'  -- Avg. value for period
    and indicator in ('USD_XDC', 'EUR_XDC')  -- USD & EUR per local currency

    {% if is_incremental() %}
    and ingested_at > (select coalesce(max(ingested_at), "1990-01-01") from {{ this }})
    {% endif %}

qualify row_number() over (
    partition by country, time_period, indicator
    order by ingested_at desc
) = 1