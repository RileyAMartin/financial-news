select
    country_code,
    official_name,
    display_name,
    current_timestamp() as processed_at
from {{ ref("imf_country_abbreviations") }}