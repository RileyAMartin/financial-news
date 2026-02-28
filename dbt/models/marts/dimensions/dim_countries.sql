select
    country_code,
    official_name,
    display_name
from {{ ref("imf_country_abbreviations") }}