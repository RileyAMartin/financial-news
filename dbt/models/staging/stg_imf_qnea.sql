select
    country as country_code,
    indicator as indicator_code,
    {{ parse_imf_date('time_period') }} as period_end_date,
    'Q' as frequency,
    obs_value,
    case
        when price_type = 'Q' then True
        else False
    end as is_inflation_adjusted
from {{ source("raw_data", "imf_qnea_raw") }}

where
    obs_value is not null
    and indicator is not null
    and time_period is not null
    and country is not null
    and price_type in ('Q', 'V')  -- Constant and current prices
    and type_of_transformation = 'XDC'  -- Local currency
    and s_adjustment = 'SA'  -- Seasonally adjusted

qualify row_number() over (
    partition by country, indicator, time_period, price_type
    order by ingested_at desc
) = 1