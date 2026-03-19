select
    cast(date as date) as date_day,
    upper(base_currency_code) as base_currency_code,
    upper(quote_currency_code) as quote_currency_code,
    cast(open_price as float64) as open_price,
    cast(high_price as float64) as high_price,
    cast(low_price as float64) as low_price,
    cast(close_price as float64) as close_price
from {{ source('raw_data', 'fx_raw') }}
where
    date is not null
    and base_currency_code is not null
    and quote_currency_code is not null
    and close_price is not null
    and upper(quote_currency_code) = 'USD'