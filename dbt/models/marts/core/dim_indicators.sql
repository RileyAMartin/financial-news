select
    {{ dbt_utils.generate_surrogate_key(["indicator_code"])}} as indicator_id,
    indicator_code,
    indicator_name,
    indicator_description
from {{ ref("imf_qnea_indicators") }}