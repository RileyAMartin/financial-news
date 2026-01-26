import json
import feedparser
import functions_framework
from google.cloud import bigquery

FEEDS = {
    "cnbc_world_news": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    "cnbc_us_news": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15837362",
    "cnbc_asia_news": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19832390",
    "cnbc_europe_news": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19794221",
    "ft_global_economy": "https://www.ft.com/global-economy?format=rss",
    "un_global": "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml",
    "un_middle_east": "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml",
    "un_africa": "https://news.un.org/feed/subscribe/en/news/region/africa/feed/rss.xml",
    "un_europe": "https://news.un.org/feed/subscribe/en/news/region/europe/feed/rss.xml",
    "un_americas": "https://news.un.org/feed/subscribe/en/news/region/americas/feed/rss.xml",
    "un_asia_pacific": "https://news.un.org/feed/subscribe/en/news/region/asia-pacific/feed/rss.xml",
    "un_economic_development": "https://news.un.org/feed/subscribe/en/news/topic/economic-development/feed/rss.xml",
}

@functions_framework.http
def ingest_rss(request):
    """Uploads raw RSS feed data to BigQuery."""
    client = bigquery.Client()
    table_id = "international-finance-484205.raw_data.rss_feeds_raw"
    
    rows_to_insert = []
    for name, url in FEEDS.items():
        feed = feedparser.parse(url)
        if "entries" not in feed:
            continue
        rows_to_insert.extend(
            {
                "source": name,
                "raw_content": json.dumps(dict(entry), default=str)
            }
            for entry in feed["entries"]
        )

    try:
        errors = client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            error_msg = f"BigQuery Errors: {errors}"
            print(error_msg)
            return error_msg, 500

        output = f"Inserted {len(rows_to_insert)} rows"
        print(output)
        return output, 200
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(error_msg)
        return error_msg, 500
