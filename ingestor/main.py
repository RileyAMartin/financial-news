from google.cloud import bigquery
import feedparser
import datetime

client = bigquery.Client()
TABLE_ID = "international-finance-484205.raw_data.rss_feeds_raw"

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

def insert_data_http(request):
    """Uploads raw RSS feed data to BigQuery."""
    rows_to_insert = []
    for name, url in FEEDS.items():
        feed = feedparser.parse(url)
        if "entries" not in feed:
            continue
        rows_to_insert.extend(
            {"source": name, "raw_content": dict(entry)}
            for entry in feed["entries"]
        )

    errors = client.insert_rows_json(TABLE_ID, rows_to_insert)

    if errors:
        print(f"Errors occured: {errors}")
    else:
        print(f"Inserted {len(rows_to_insert)} rows")