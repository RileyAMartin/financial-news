from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from utils.common import (
    VENV_ACTIVATE,
    DBT_PROJECT_DIR,
    IMF_FX_URL,
    IMF_QNEA_URL,
    REVERSE_ETL_URL,
    call_authenticated_cloud_function,
)

with DAG(
    dag_id="economics_pipeline",
    default_args={
        "owner": "Riley",
        "retries": 1,
        "retry_delay": timedelta(minutes=5),
    },
    description="Ingests IMF FX and QNEA data, runs dbt transformations, and syncs to CockroachDB",
    schedule_interval="@weekly",
    start_date=datetime(2026, 3, 1),
    catchup=False,
    tags=["economics"],
) as dag:

    ingest_imf_fx = PythonOperator(
        task_id="ingest_imf_fx",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={"url": IMF_FX_URL},
    )

    ingest_imf_qnea = PythonOperator(
        task_id="ingest_imf_qnea",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={"url": IMF_QNEA_URL},
    )

    run_dbt_economics_models = BashOperator(
        task_id="run_dbt_economics",
        bash_command=(
            f"source {VENV_ACTIVATE} && cd {DBT_PROJECT_DIR} && "
            "dbt deps && dbt build --selector economics_pipeline --profiles-dir ."
        ),
    )

    sync_fct_economics = PythonOperator(
        task_id="reverse_etl_fct_economics",
        python_callable=call_authenticated_cloud_function,
        op_kwargs={
            "url": REVERSE_ETL_URL,
            "payload": {
                "bq_dataset": "dbt_prod",
                "bq_table": "fct_economics",
                "pg_table": "fct_economics",
                "columns": [
                    "country_code",
                    "source_code",
                    "indicator_code",
                    "period_end_date",
                    "frequency",
                    "is_inflation_adjusted",
                    "ingested_at",
                    "value_local",
                    "value_usd",
                    "value_eur",
                ],
                "conflict_columns": [
                    "country_code",
                    "indicator_code",
                    "period_end_date",
                    "is_inflation_adjusted",
                ],
                "watermark_column": "ingested_at",
            },
        },
    )

    ingest_imf_fx >> ingest_imf_qnea >> run_dbt_economics_models >> sync_fct_economics
