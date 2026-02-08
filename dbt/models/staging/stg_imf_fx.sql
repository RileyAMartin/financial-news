select
    country as country_id,
    indicator as indicator_id,
    {{ parse_imf_date('time_period') }} as period_end_date,
    'Q' as frequency,
    obs_value
from {{ source("raw_data", "imf_fx_raw") }}

where
    country is not null
    and obs_value is not null
    and time_period is not null
    and frequency = 'Q'
    and type_of_transformation = 'PA_RT'  -- Avg. value for period
    and indicator in ('USD_XDC', 'EUR_XDC')  -- USD & EUR per local currency

qualify row_number() over (
    partition by country, time_period, indicator
    order by ingested_at desc
) = 1