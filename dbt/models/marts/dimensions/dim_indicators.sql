select
    indicator_code,
    name,
    description,
    annualization_multiplier,
    current_timestamp() as processed_at
from {{ ref("imf_qnea_indicators") }}