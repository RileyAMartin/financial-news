from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from utils.common import (
    VENV_ACTIVATE,
    DBT_PROJECT_DIR,
    REVERSE_ETL_URL,
    call_authenticated_cloud_function,
)

with DAG(
    dag_id="dimensions_pipeline",
    default_args={
        "owner": "Riley",
        "retries": 1,
    },
    description="Manually triggered DAG to seed and sync dimensional reference data",
    schedule_interval=None,
    start_date=datetime(2026, 3, 1),
    catchup=False,
    tags=["economics", "dimensions"],
) as dag:

    run_dbt_seeds_and_dims = BashOperator(
        task_id="run_dbt_seeds_and_dims",
        bash_command=(
            f"source {VENV_ACTIVATE} && cd {DBT_PROJECT_DIR} && "
            "dbt deps && dbt seed && dbt build --selector dimensions_pipeline --profiles-dir . --full-refresh"
        ),
    )

    sync_dim_countries = PythonOperator(
        task_id="reverse_etl_dim_countries",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "dim_countries",
                "pg_table": "dim_countries",
                "columns": [
                    "country_code",
                    "official_name",
                    "currency_code",
                    "display_name",
                    "processed_at"
                ],
                "conflict_columns": ["country_code"],
                "watermark_column": None,
                "full_refresh": True,
            },
        },
    )

    sync_dim_currencies = PythonOperator(
        task_id="reverse_etl_dim_currencies",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "dim_currencies",
                "pg_table": "dim_currencies",
                "columns": [
                    "currency_code",
                    "currency_name",
                    "processed_at",
                ],
                "conflict_columns": ["currency_code"],
                "watermark_column": None,
                "full_refresh": True,
            },
        },
    )

    sync_dim_indicators = PythonOperator(
        task_id="reverse_etl_dim_indicators",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "dim_indicators",
                "pg_table": "dim_indicators",
                "columns": ["indicator_code", "name", "description", "processed_at"],
                "conflict_columns": ["indicator_code"],
                "watermark_column": None,
                "full_refresh": True,
            },
        },
    )

    sync_dim_sources = PythonOperator(
        task_id="reverse_etl_dim_sources",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "dim_sources",
                "pg_table": "dim_sources",
                "columns": [
                    "source_code",
                    "publisher",
                    "publisher_short",
                    "dataset",
                    "dataset_short",
                    "url",
                    "processed_at",
                ],
                "conflict_columns": ["source_code"],
                "watermark_column": None,
                "full_refresh": True,
            },
        },
    )

    sync_dim_date = PythonOperator(
        task_id="reverse_etl_dim_date",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "dim_date",
                "pg_table": "dim_date",
                "columns": [
                    "date_day",
                    "date_year",
                    "date_month",
                    "date_quarter",
                    "is_quarter_end",
                    "year_quarter",
                    "financial_quarter",
                    "financial_year",
                    "processed_at",
                ],
                "conflict_columns": ["date_day"],
                "watermark_column": None,
                "full_refresh": True,
            },
        },
    )

    run_dbt_seeds_and_dims >> [
        sync_dim_currencies,
        sync_dim_countries,
        sync_dim_indicators,
        sync_dim_sources,
        sync_dim_date,
    ]
