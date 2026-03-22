import os
import requests
import google.auth.transport.requests
import google.oauth2.id_token

# Path variables
DAGS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(DAGS_DIR)))
VENV_ACTIVATE = os.path.join(REPO_ROOT, "airflow", "venv", "bin", "activate")
DBT_PROJECT_DIR = os.path.join(REPO_ROOT, "dbt")

# Cloud function URLs
RSS_INGESTOR_URL = "https://australia-southeast2-international-finance-484205.cloudfunctions.net/rss-ingestor"
IMF_QNEA_URL = "https://australia-southeast2-international-finance-484205.cloudfunctions.net/imf-qnea-ingestor"
REVERSE_ETL_URL = "https://australia-southeast2-international-finance-484205.cloudfunctions.net/reverse-etl"
YAHOO_FX_INGESTOR_URL = "https://australia-southeast2-international-finance-484205.cloudfunctions.net/yahoo-fx-ingestor"

HTTP_CONNECT_TIMEOUT_SECONDS = 15
HTTP_READ_TIMEOUT_SECONDS = 3600


def call_authenticated_cloud_function(url: str, payload: dict = None):
    """Generates a GCP Identity token and invokes a protected Cloud Function."""
    auth_req = google.auth.transport.requests.Request()
    id_token = google.oauth2.id_token.fetch_id_token(auth_req, url)

    headers = {"Authorization": f"Bearer {id_token}"}

    request_timeout = (HTTP_CONNECT_TIMEOUT_SECONDS, HTTP_READ_TIMEOUT_SECONDS)

    try:
        if payload:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=request_timeout,
            )
        else:
            response = requests.post(
                url,
                headers=headers,
                timeout=request_timeout,
            )
    except requests.Timeout as exc:
        raise TimeoutError(
            f"Timed out waiting for Cloud Function response from {url}. "
            f"connect={HTTP_CONNECT_TIMEOUT_SECONDS}s read={HTTP_READ_TIMEOUT_SECONDS}s"
        ) from exc

    if not response.ok:
        print(f"CLOUD FUNCTION ERROR: {response.text}")

    response.raise_for_status()
    print(response.text)