from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
import requests
import google.auth.transport.requests
import google.oauth2.id_token
import os

DAGS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(DAGS_DIR))
VENV_ACTIVATE = os.path.join(REPO_ROOT, "airflow", "venv", "bin", "activate")
DBT_PROJECT_DIR = os.path.join(REPO_ROOT, "dbt")

RSS_INGESTOR_URL = "https://australia-southeast2-international-finance-484205.cloudfunctions.net/rss-ingestor"
REVERSE_ETL_URL = "https://australia-southeast2-international-finance-484205.cloudfunctions.net/reverse-etl"

DBT_ACCOUNT_ID = "70471823444399"
DBT_JOB_ID = "70471823564264"

def call_authenticated_cloud_function(url: str, payload: dict = None):
    """Generates a GCP Identity token and invokes a protected Cloud Function."""
    auth_req = google.auth.transport.requests.Request()
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, url)
    
    headers = {"Authorization": f"Bearer {id_token}"}
    
    if payload:
        response = requests.post(url, json=payload, headers=headers)
    else:
        response = requests.post(url, headers=headers)
    
    if not response.ok:
        print(f"CLOUD FUNCTION ERROR: {response.text}")

    response.raise_for_status()
    print(response.text)

with DAG(
    dag_id="hourly_news_pipeline",
    default_args={
        "owner": "Riley",
        "retries": 1,
        "retry_delay": timedelta(minutes=5),
    },
    description="Extracts RSS feeds, runs dbt transformations, and syncs to CockroachDB",
    schedule_interval="@hourly",
    start_date=datetime(2026, 3, 1),
    catchup=False,
    tags=["news"],
) as dag:

    ingest_rss_task = PythonOperator(
        task_id="ingest_rss_feeds",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={"url": RSS_INGESTOR_URL}
    )

    run_dbt_news_models = BashOperator(
        task_id="run_dbt_news",
        bash_command=f"source {VENV_ACTIVATE} && cd {DBT_PROJECT_DIR} && dbt deps && dbt build --select tag:news --profiles-dir ."
    )

    sync_fct_news = PythonOperator(
        task_id="reverse_etl_fct_news",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "fct_news",
                "pg_table": "fct_news",
                "columns": [
                    "url", 
                    "ingested_at", 
                    "feed_name", 
                    "title", 
                    "summary", 
                    "published_at", 
                    "country_codes"
                ],
                "conflict_columns": ["url"],
                "watermark_column": "ingested_at"
            }
        }
    )

    ingest_rss_task >> run_dbt_news_models >> sync_fct_news