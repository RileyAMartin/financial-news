select
    source_code,
    publisher,
    publisher_short,
    dataset,
    dataset_short,
    url,
    current_timestamp() as processed_at
from {{ ref("data_sources") }}
