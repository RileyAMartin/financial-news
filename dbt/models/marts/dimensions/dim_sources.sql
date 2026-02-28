select
    source_code,
    publisher,
    publisher_short,
    dataset,
    dataset_short,
    url
from {{ ref("data_sources") }}
