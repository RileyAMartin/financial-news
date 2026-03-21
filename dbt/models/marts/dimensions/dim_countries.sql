select
    country_code,
    official_name,
    display_name,
    currency_code,
    current_timestamp() as processed_at
from {{ ref("country_metadata") }}