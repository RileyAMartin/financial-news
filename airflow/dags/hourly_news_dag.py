from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from utils.common import (
    VENV_ACTIVATE,
    DBT_PROJECT_DIR,
    RSS_INGESTOR_URL,
    REVERSE_ETL_URL,
    call_authenticated_cloud_function,
)

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
        op_kwargs={"url": RSS_INGESTOR_URL},
    )

    run_dbt_news_models = BashOperator(
        task_id="run_dbt_news",
        bash_command=(
            f"source {VENV_ACTIVATE} && cd {DBT_PROJECT_DIR} && "
            "dbt deps && dbt build --selector news_pipeline --profiles-dir ."
        ),
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
                    "processed_at",
                    "feed_name",
                    "title",
                    "summary",
                    "published_at",
                    "date_day",
                    "country_codes",
                ],
                "conflict_columns": ["url"],
                "watermark_column": "processed_at",
            },
        },
    )

    ingest_rss_task >> run_dbt_news_models >> sync_fct_news
