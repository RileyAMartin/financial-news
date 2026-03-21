select
    country_code,
    currency_code,
    currency_name,
    current_timestamp() as processed_at
from {{ ref('currencies') }}
