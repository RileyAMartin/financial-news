select
    source_code as source_id,
    source_publisher,
    source_publisher_short,
    source_dataset,
    source_dataset_short,
    source_url
from {{ ref("data_sources") }}
