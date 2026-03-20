select
    indicator_code,
    name,
    description,
    current_timestamp() as processed_at
from {{ ref("imf_qnea_indicators") }}