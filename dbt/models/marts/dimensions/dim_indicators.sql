select
    indicator_code,
    name,
    description
from {{ ref("imf_qnea_indicators") }}