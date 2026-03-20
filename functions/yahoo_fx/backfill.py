import pandas as pd
import yfinance as yf
import functions_framework
import logging
from datetime import datetime, timezone, timedelta
from google.cloud import bigquery

import dotenv
dotenv.load_dotenv()

# Set up logging for better visibility in GCP console
logging.basicConfig(level=logging.INFO)

@functions_framework.http
def ingest_daily_fx_yahoo(request):
    payload = request.get_json(silent=True) or {}
    
    # 1. Handle Date Parameters
    # For backfilling, you can pass {"start_date": "1990-01-01", "end_date": "2026-03-18"}
    start_date = payload.get("start_date")
    end_date = payload.get("end_date") # yfinance 'end' is exclusive

    if not start_date:
        return "Missing required parameter: 'start_date' (format: YYYY-MM-DD)", 400

    client = bigquery.Client()
    table_id = "international-finance-484205.raw_data.fx_raw"
    
    try:
        currency_df = pd.read_csv('currencies.csv')
    except FileNotFoundError:
        logging.error("currencies.csv not found.")
        return "`currencies`.csv not found.", 500

    currency_codes = currency_df['currency_code'].unique()
    tickers = [f"{code}USD=X" for code in currency_codes if code != 'USD']
    
    logging.info(f"Downloading data for {len(tickers)} tickers from {start_date} to {end_date or 'Today'}")
    
    # 2. Download Data
    # 'threads=True' is essential for large historical backfills
    data = yf.download(
        tickers, 
        start=start_date, 
        end=end_date, 
        interval="1d", 
        group_by='ticker', 
        threads=True
    )
    
    all_records = []
    
    # 3. Robust Data Processing
    for ticker in tickers:
        try:
            # Handle the difference between MultiIndex (multiple tickers) and Single Index (one ticker)
            if len(tickers) > 1:
                if ticker not in data.columns.levels[0]:
                    continue
                ticker_df = data[ticker].copy()
            else:
                ticker_df = data.copy()

            ticker_df = ticker_df.dropna(subset=['Close'])
            base_currency = ticker.replace('USD=X', '')

            for date, row in ticker_df.iterrows():
                all_records.append({
                    "date": date.strftime('%Y-%m-%d'),
                    "open_price": float(row['Open']),
                    "high_price": float(row['High']),
                    "low_price": float(row['Low']),
                    "close_price": float(row['Close']),
                    "base_currency_code": base_currency, # Standardized naming
                    "quote_currency_code": 'USD',
                    "ingested_at": datetime.now(tz=timezone.utc).isoformat()
                })
        except Exception as e:
            logging.warning(f"Failed to process {ticker}: {str(e)}")
            continue

    if not all_records:
        return "No data found for the given range.", 200

    # 4. BigQuery Ingestion
    final_df = pd.DataFrame(all_records)
    
    # For backfills, we use WRITE_APPEND. 
    # If you mess up and need to restart, you can use WRITE_TRUNCATE once.
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
        autodetect=True
    )

    try:
        logging.info(f"Uploading {len(final_df)} rows to BigQuery...")
        job = client.load_table_from_dataframe(final_df, table_id, job_config=job_config)
        job.result()
        return f"Successfully backfilled {len(final_df)} rows into BigQuery", 200
    except Exception as e:
        logging.exception("BigQuery Load Job failed")
        return f"BigQuery Error: {str(e)}", 500

if __name__ == "__main__":

    class MockRequest:
        def get_json(self, silent=False):
            return {
                "start_date": "1990-01-01",
                "end_date": "2026-03-18"
            }
    ingest_daily_fx_yahoo(MockRequest())