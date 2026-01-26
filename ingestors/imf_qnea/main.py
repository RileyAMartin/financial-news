import io
import requests
import pandas as pd
import functions_framework
from datetime import datetime, timezone
from google.cloud import bigquery

def get_current_time_period_str() -> str:
    """
    Returns the earliest time period (in quarters) to query for data.
    The QNEA dataset aligns with the calendar year, with Q1 being Jan-Mar.
    We query for the last 2 quarters of data to ensure that we don't miss anything,
    (there doesn't seem to be a fixed upload schedule for this dataset)
    and duplicates are later filtered out during staging.    
    """
    
    now = datetime.now(tz=timezone.utc)
    curr_year = now.year
    curr_month = now.month

    curr_quarter = (curr_month - 1) // 3 + 1

    # Subtract 2 quarters from current quarter
    if curr_quarter <= 2:
        target_quarter = curr_quarter + 2
        target_year = curr_year - 1
    else:
        target_quarter = curr_quarter - 2
        target_year = curr_year

    return f"{target_year}-Q{target_quarter}"


@functions_framework.http
def ingest_imf_data(request):
    """Ingests data from the IMF National Economic Accounts (Quarterly) to BigQuery."""
    client = bigquery.Client()
    table_id = "international-finance-484205.raw_data.imf_qnea_raw"

    base_url = "https://api.imf.org/external/sdmx/3.0/data"
    context = "dataflow"
    agency = "IMF.STA"  # IMF stats agency
    resource = "QNEA"  # Quarterly National Economic Accounts
    version = "+"  # Latest
    key = "*.*.*.*.*"  # {Country}.{Indicator}.{Price}.{Adj}.{Trans}

    headers = {
        "Accept": "application/vnd.sdmx.data+csv;version=2.0.0"
    }
    params = {
        "c[TIME_PERIOD]": f"ge:{get_current_time_period_str()}"
    }
    full_url = f"{base_url}/{context}/{agency}/{resource}/{version}/{key}"

    response = requests.get(
        full_url,
        headers=headers,
        params=params
    )
    
    if response.status_code != 200:
        return f"IMF API Error: {response.status_code} - {response.text}", 500

    df = pd.read_csv(io.StringIO(response.text))

    df.columns = (df.columns
        .str.replace(r":.+", "", regex=True)
        .str.replace(r"[\s\-]+", "_", regex=True)
        .str.replace(r"\W", "", regex=True)
        .str.lower()
        .str.strip("_")
    )

    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
        autodetect=True
    )

    job = client.load_table_from_dataframe(
        df, table_id, job_config=job_config
    )

    try:
        job.result()
        output = f"Inserted {len(df)} rows into BigQuery"
        return output, 500
    except Exception as e:
        error_msg = f"BigQuery Job failed: {str(e)}"
        if job.errors:
            error_msg += f" | Details : {job.errors}"
        print(error_msg)
        return error_msg, 200
