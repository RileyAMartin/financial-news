import pandas as pd
import yfinance as yf
import functions_framework
from datetime import datetime, timezone
from google.cloud import bigquery

@functions_framework.http
def ingest_daily_fx_yahoo(request):
    """Ingests daily FX data from Yahoo Finance to BigQuery."""
    payload = request.get_json(silent=True) or {}
    start_date = payload.get("start_date")

    if not start_date:
        return "Missing required parameter: 'start_date' (format: YYYY-MM-DD)", 400

    client = bigquery.Client()
    table_id = "international-finance-484205.raw_data.fx_raw"
    
    try:
        currency_df = pd.read_csv('currencies.csv')
    except FileNotFoundError:
        return "`currencies`.csv not found.", 500

    currency_codes = currency_df['currency_code'].unique()
    tickers = [f"{code}USD=X" for code in currency_codes if code != 'USD']
    
    data = yf.download(tickers, start=start_date, interval="1d", group_by='ticker', threads=True)
    
    all_records = []
    
    for ticker in tickers:
        if len(tickers) > 1:
            if ticker not in data.columns.levels[0]: continue
            ticker_df = data[ticker].copy()
        else:
            ticker_df = data.copy()

        ticker_df = ticker_df.dropna(subset=['Close', 'Open', 'High', 'Low'])
        base_currency = ticker.replace('USD=X', '')

        for date, row in ticker_df.iterrows():
            all_records.append({
                "date_day": date.strftime('%Y-%m-%d'),
                "open_price": float(row['Open']),
                "high_price": float(row['High']),
                "low_price": float(row['Low']),
                "close_price": float(row['Close']),
                "base_currency_code": base_currency,
                "quote_currency_code": 'USD',
                "ingested_at": datetime.now(tz=timezone.utc).isoformat()
            })

    if not all_records:
        return "No data to ingest for the given date range.", 200

    final_df = pd.DataFrame(all_records)
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
        autodetect=True
    )

    job = client.load_table_from_dataframe(
        final_df,
        table_id,
        job_config=job_config
    )

    try:
        job.result()
        output = f"Inserted {len(final_df)} rows into BigQuery"
        return output, 200
    except Exception as e:
        error_msg = f"BigQuery Job failed: {str(e)}"
        if job.errors:
            error_msg += f" | Details: {job.errors}"
        print(error_msg)
        return error_msg, 500