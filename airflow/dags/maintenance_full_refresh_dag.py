import logging
from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator
from utils.common import call_authenticated_cloud_function, REVERSE_ETL_URL

default_args = {
    "owner": "Riley",
    "retries": 0,
}

def execute_dynamic_full_refresh(**context):
    """
    Triggers Reverse ETL Cloud Function with full_refresh enabled for 
    each configuration provided in the DAG run JSON.


    Expected JSON Configuration:
    {
        "syncs": [
            {
                "bq_dataset": "dbt_prod",
                "bq_table": "table_name",
                "pg_table": "table_name",
                "columns": ["col1", "col2"],
                "conflict_columns": ["col1"],
                "watermark_column": "ingested_at"  # Optional
            }
        ]
    }
    """
    conf = context.get("dag_run").conf or {}
    sync_configs = conf.get("syncs", [])

    for sync_config in sync_configs:
        sync_config["full_refresh"] = True
        
        try:
            call_authenticated_cloud_function(REVERSE_ETL_URL, sync_config)
        except Exception:
            logging.exception(f"Refresh failed for table: {sync_config.get('pg_table', 'unknown')}")
            raise

with DAG(
    "maintenance_dynamic_full_refresh",
    default_args=default_args,
    description="Dynamic Truncate & Load runner. Pass full schema config via JSON conf.",
    schedule_interval=None, 
    start_date=datetime(2026, 3, 1),
    catchup=False,
    tags=["maintenance"],
) as dag:

    run_syncs = PythonOperator(
        task_id="execute_reverse_etl_syncs",
        python_callable=execute_dynamic_full_refresh,
        provide_context=True,
    )
