from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from utils.common import (
    VENV_ACTIVATE,
    DBT_PROJECT_DIR,
    YAHOO_FX_INGESTOR_URL,
    REVERSE_ETL_URL,
    call_authenticated_cloud_function,
)

with DAG(
    dag_id="daily_fx_pipeline",
    default_args={
        "owner": "Riley",
        "retries": 1,
        "retry_delay": timedelta(minutes=5),
    },
    description="Ingests FX market data, runs dbt FX models, and syncs daily and quarterly FX facts to CockroachDB",
    schedule_interval="@daily",
    start_date=datetime(2026, 3, 1),
    catchup=False,
    tags=["fx"],
) as dag:

    ingest_yahoo_fx = PythonOperator(
        task_id="ingest_yahoo_fx",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": YAHOO_FX_INGESTOR_URL,
            "payload": {
                "start_date": datetime.now().strftime("%Y-%m-%d"),
            }
        },
    )

    run_dbt_fx_models = BashOperator(
        task_id="run_dbt_fx",
        bash_command=(
            f"source {VENV_ACTIVATE} && cd {DBT_PROJECT_DIR} && "
            "dbt deps && dbt build --selector fx_pipeline --profiles-dir ."
        ),
    )

    sync_fct_fx = PythonOperator(
        task_id="reverse_etl_fct_fx",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "fct_fx",
                "pg_table": "fct_fx",
                "columns": [
                    "source_code",
                    "base_currency_code",
                    "quote_currency_code",
                    "date_day",
                    "open_price",
                    "high_price",
                    "low_price",
                    "close_price",
                    "ingested_at",
                    "processed_at",
                ],
                "conflict_columns": [
                    "source_code",
                    "base_currency_code",
                    "quote_currency_code",
                    "date_day",
                ],
                "watermark_column": "processed_at",
            },
        },
    )

    sync_fct_fx_quarterly = PythonOperator(
        task_id="reverse_etl_fct_fx_quarterly",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "fct_fx_quarterly",
                "pg_table": "fct_fx_quarterly",
                "columns": [
                    "source_code",
                    "base_currency_code",
                    "quote_currency_code",
                    "date_year",
                    "date_quarter",
                    "open_price",
                    "high_price",
                    "low_price",
                    "period_average_rate",
                    "ingested_at",
                    "processed_at",
                ],
                "conflict_columns": [
                    "source_code",
                    "base_currency_code",
                    "quote_currency_code",
                    "date_year",
                    "date_quarter",
                ],
                "watermark_column": "processed_at",
            },
        },
    )

    ingest_yahoo_fx >> run_dbt_fx_models >> [sync_fct_fx, sync_fct_fx_quarterly]


if __name__ == "__main__":
    dag.test()
