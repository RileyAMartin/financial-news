import os
import json
from datetime import datetime
import functions_framework
from google.cloud import bigquery
import psycopg2
from psycopg2.extras import execute_values

BATCH_SIZE = 1000

@functions_framework.http
def reverse_etl_news(request):
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    db_url = os.environ.get("DB_URL")
    if not db_url:
        raise ValueError("Database connection string not found")
    
    conn = psycopg2.connect(db_url)

    # Get the initial watermark for news items
    with conn.cursor() as cur:
        cur.execute("SELECT last_ingested_at FROM meta_sync_status WHERE job_name = 'news';")
        result = cur.fetchone()
        
        if not result or not isinstance(result[0], datetime):
            raise ValueError("No valid last ingested time for news job.")
            
        last_ingested_at = result[0]

    bq_client = bigquery.Client()
    
    bq_query = """
        SELECT
            link as url, 
            feed_name as source_id, 
            title, 
            summary,
            published_at, 
            country_codes
        FROM `international-finance-484205.dbt_prod.fct_news`
        WHERE published_at > @last_ingested
        ORDER BY published_at ASC
    """
    
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("last_ingested", "TIMESTAMP", last_ingested_at)
        ]
    )

    rows_iterator = bq_client.query(bq_query, job_config=job_config).result()

    insert_query = """
        INSERT INTO news_items (url, source_id, title, summary, published_at, country_tags)
        VALUES %s
        ON CONFLICT (url) DO NOTHING;
    """
    
    update_watermark_query = """
        UPDATE meta_sync_status 
        SET last_ingested_at = %s 
        WHERE job_name = 'news';
    """

    batch = []
    total_inserted = 0
    batch_latest_timestamp = last_ingested_at

    # Add each row to the batch and insert when batch size is reached
    for row in rows_iterator:
        tags_json = json.dumps(row.country_codes) if row.country_codes else '[]'
        
        record = (
            row.url, row.source_id, row.title, row.summary,
            row.published_at, tags_json
        )
        batch.append(record)
        
        if row.published_at > batch_latest_timestamp:
            batch_latest_timestamp = row.published_at

        if len(batch) >= BATCH_SIZE:
            with conn.cursor() as cur:
                execute_values(cur, insert_query, batch)
                cur.execute(update_watermark_query, (batch_latest_timestamp,))
            conn.commit()
            
            total_inserted += len(batch)
            batch = []

    # Flush remaining rows
    if batch:
        with conn.cursor() as cur:
            execute_values(cur, insert_query, batch)
            cur.execute(update_watermark_query, (batch_latest_timestamp,))
        conn.commit()
        total_inserted += len(batch)

    conn.close()

    output_msg = f"Successfully synced {total_inserted} news items to CockroachDB."
    print(output_msg)
    return output_msg, 200