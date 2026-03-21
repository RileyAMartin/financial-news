import os
import re
import functions_framework
from google.cloud import bigquery
from psycopg2 import sql
import psycopg2
from psycopg2.extras import execute_values

BATCH_SIZE = 10000

# Rejects anything that isn't a plain snake_case word
_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _validate_identifier(name: str, label: str) -> None:
    """Raise ValueError if *name* is not a safe SQL identifier."""
    if not _IDENTIFIER_RE.match(name):
        raise ValueError(f"Unsafe {label} identifier: {name!r}")


def get_db_connection():
    """Initialise and return a connection to the destination PostgreSQL db using credentials."""

    db_url = os.environ.get("DB_URL")
    db_cert_content = os.environ.get("DB_CERT")

    if not db_url or not db_cert_content:
        raise ValueError("Environment variables DB_URL and DB_CERT must be set.")
    
    cert_path = "/tmp/root.crt"

    if not os.path.exists(cert_path):
        with open(cert_path, "w") as cert_file:
            cert_file.write(db_cert_content)
    
    separator = "&" if "?" in db_url else "?"
    ssl_params = f"sslmode=verify-full&sslrootcert={cert_path}"
    authenticated_url = f"{db_url}{separator}{ssl_params}"

    return psycopg2.connect(authenticated_url)

def _get_watermark(
    conn: psycopg2.extensions.connection, pg_table: str, watermark_column: str
):
    """
    Return MAX(watermark_column) from the destination table, or None if the
    table is empty. Used to scope the BigQuery pull to only new rows.
    """
    query = sql.SQL("SELECT MAX({col}) FROM {table};").format(
        col=sql.Identifier(watermark_column),
        table=sql.Identifier(pg_table),
    )
    with conn.cursor() as cur:
        cur.execute(query)
        result = cur.fetchone()
    return result[0] if result else None


def _build_bq_query(
    bq_dataset: str,
    bq_table: str,
    columns: list[str],
    watermark_column: str | None,
    watermark_value,
) -> tuple[str, bigquery.QueryJobConfig]:
    """
    Build the BigQuery SELECT statement and its job config.
    """
    col_list = ", ".join(f"`{c}`" for c in columns)
    base_query = f"SELECT {col_list} FROM `{bq_dataset}.{bq_table}`"

    if watermark_column and watermark_value is not None:
        query = f"{base_query} WHERE `{watermark_column}` > @watermark"
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("watermark", "TIMESTAMP", watermark_value)
            ]
        )
    else:
        query = base_query
        job_config = bigquery.QueryJobConfig()
    return query, job_config


def _build_upsert(
    conn: psycopg2.extensions.connection,
    pg_table: str,
    columns: list[str],
    conflict_columns: list[str],
) -> str:
    """
    Compose and return the upsert SQL as a plain string.
    """
    update_columns = [c for c in columns if c not in conflict_columns]

    shared = dict(
        table=sql.Identifier(pg_table),
        cols=sql.SQL(", ").join(sql.Identifier(c) for c in columns),
        conflict=sql.SQL(", ").join(sql.Identifier(c) for c in conflict_columns),
    )

    if update_columns:
        composed = sql.SQL(
            "INSERT INTO {table} ({cols}) VALUES %s "
            "ON CONFLICT ({conflict}) DO UPDATE SET {updates};"
        ).format(
            **shared,
            updates=sql.SQL(", ").join(
                sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(c), sql.Identifier(c))
                for c in update_columns
            ),
        )
    else:
        composed = sql.SQL(
            "INSERT INTO {table} ({cols}) VALUES %s "
            "ON CONFLICT ({conflict}) DO NOTHING;"
        ).format(**shared)
    return composed.as_string(conn)


@functions_framework.http
def reverse_etl(request):
    """
    Reverse ETL that reads from a BigQuery table and upserts into PostgreSQL.

    Expected JSON payload:
    {
        "bq_dataset":        "dbt_prod",
        "bq_table":          "fct_economics",
        "pg_table":          "fct_economics",
        "columns":           ["country_code", "indicator_code", "time_period", "value"],
        "conflict_columns":  ["country_code", "indicator_code", "time_period"],
        "watermark_column":  "ingested_at"   // optional — enables incremental loads
    }

    When `watermark_column` is supplied, the function queries MAX(watermark_column)
    from the destination table and restricts the BigQuery pull to rows newer than
    that value. If the destination table is empty, a full load is performed instead.
    """
    conn = None
    try:
        try:
            from dotenv import load_dotenv

            load_dotenv()
        except ImportError:
            pass

        payload = request.get_json(silent=True)
        if not payload:
            return ({"error": "Request body must be valid JSON."}, 400)
        required_keys = [
            "bq_dataset",
            "bq_table",
            "pg_table",
            "columns",
            "conflict_columns",
        ]
        missing = [k for k in required_keys if k not in payload]
        if missing:
            return (
                {"error": f"Missing required parameter(s): {', '.join(missing)}"},
                400,
            )
        bq_dataset: str = payload["bq_dataset"]
        bq_table: str = payload["bq_table"]
        pg_table: str = payload["pg_table"]
        columns: list[str] = payload["columns"]
        conflict_columns: list[str] = payload["conflict_columns"]
        watermark_column: str | None = payload.get("watermark_column")
        full_refresh: bool = payload.get("full_refresh", False)

        if not isinstance(columns, list) or not columns:
            return ({"error": "'columns' must be a non-empty list of strings."}, 400)
        if not isinstance(conflict_columns, list) or not conflict_columns:
            return (
                {"error": "'conflict_columns' must be a non-empty list of strings."},
                400,
            )
        invalid_conflicts = [c for c in conflict_columns if c not in columns]
        if invalid_conflicts:
            return (
                {
                    "error": f"conflict_columns {invalid_conflicts} are not present in 'columns'."
                },
                400,
            )
        identifiers_to_validate = [bq_dataset, bq_table, pg_table] + columns
        if watermark_column:
            identifiers_to_validate.append(watermark_column)
        for name in identifiers_to_validate:
            _validate_identifier(name, "identifier")

        # Get the high watermark from the destination table (if applicable) and build the BigQuery query
        conn = get_db_connection()

        if full_refresh:
            with conn.cursor() as cur:
                cur.execute(sql.SQL("TRUNCATE TABLE {table} CASCADE;").format(table=sql.Identifier(pg_table)))
            conn.commit()

        watermark_value = None
        if watermark_column and not full_refresh:
            watermark_value = _get_watermark(conn, pg_table, watermark_column)
        bq_query, job_config = _build_bq_query(
            bq_dataset, bq_table, columns, watermark_column, watermark_value
        )
        rows_iterator = (
            bigquery.Client().query(bq_query, job_config=job_config).result()
        )

        upsert_str = _build_upsert(conn, pg_table, columns, conflict_columns)

        total_rows = 0
        batch = []

        # Batch upload the data into the PostgreSQL table
        for row in rows_iterator:
            batch.append(tuple(row[c] for c in columns))

            if len(batch) >= BATCH_SIZE:
                with conn.cursor() as cur:
                    execute_values(cur, upsert_str, batch)
                conn.commit()
                total_rows += len(batch)
                batch = []
        if batch:
            with conn.cursor() as cur:
                execute_values(cur, upsert_str, batch)
            conn.commit()
            total_rows += len(batch)
        return (
            {"message": f"Successfully synced {total_rows} rows to '{pg_table}'."},
            200,
        )
    except psycopg2.OperationalError as e:
        return ({"error": f"Database connection error: {e}"}, 500)
    except Exception as e:
        return ({"error": str(e)}, 500)
    finally:
        if conn is not None:
            conn.close()
