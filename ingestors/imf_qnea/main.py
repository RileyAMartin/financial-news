import io
import requests
import pandas as pd
import functions_framework
from google.cloud import bigquery
from common.utils import get_current_imf_time_period_str

@functions_framework.http
def ingest_imf_qnea_data(request):
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
        "c[TIME_PERIOD]": f"ge:{get_current_imf_time_period_str()}"
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
        return output, 200
    except Exception as e:
        error_msg = f"BigQuery Job failed: {str(e)}"
        if job.errors:
            error_msg += f" | Details: {job.errors}"
        print(error_msg)
        return error_msg, 500
