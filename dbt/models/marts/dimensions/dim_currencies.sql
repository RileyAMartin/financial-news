select
    currency_code,
    currency_name,
    current_timestamp() as processed_at
from {{ ref('currency_metadata') }}
