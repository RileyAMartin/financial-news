select
    country_code,
    currency_code,
    currency_name
from {{ ref('dim_currencies_seed') }}
