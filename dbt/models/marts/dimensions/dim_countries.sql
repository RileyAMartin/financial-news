select
    country_code as country_id,
    country_official_name,
    country_display_name
from {{ ref("imf_country_abbreviations") }}