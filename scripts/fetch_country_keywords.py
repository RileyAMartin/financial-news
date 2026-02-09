import requests
import pandas as pd
import csv
from io import StringIO

def fetch_country_data():
    # SPARQL Query to get country, ISO code, capital, and leaders
    query = """
    SELECT DISTINCT ?countryLabel ?isoCode ?capitalLabel ?headOfGovLabel ?headOfStateLabel
    WHERE {
      ?country wdt:P31 wd:Q3624078.  # Instance of: Sovereign State
      ?country wdt:P297 ?isoCode.
      
      OPTIONAL { ?country wdt:P36 ?capital. }
      OPTIONAL { ?country wdt:P6 ?headOfGov. }
      OPTIONAL { ?country wdt:P35 ?headOfState. }

      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    """

    url = "https://query.wikidata.org/sparql"
    print("Fetching data from Wikidata...")
    
    response = requests.get(url, params={'format': 'json', 'query': query})
    
    if response.status_code != 200:
        raise Exception(f"Wikidata API Error: {response.status_code}")

    data = response.json()
    
    rows = []
    seen_entries = set()

    for item in data['results']['bindings']:
        iso = item.get('isoCode', {}).get('value')
        if not iso: continue

        country_name = item.get('countryLabel', {}).get('value')
        capital = item.get('capitalLabel', {}).get('value')
        head_gov = item.get('headOfGovLabel', {}).get('value')
        head_state = item.get('headOfStateLabel', {}).get('value')

        def add_row(keyword):
            # Don't add if keyword is missing or is in id format (e.g. Q...)
            if keyword and not keyword.startswith("q") and (iso, keyword) not in seen_entries:
                rows.append({"country_iso": iso, "keyword": keyword.lower()})
                seen_entries.add((iso, keyword))

        # For head of gov., add the full name and surname as keywords (e.g. 'Donald Trump' and 'Trump')
        add_row(country_name)
        add_row(capital)
        add_row(head_state)
        add_row(head_gov)
        if head_gov:
            add_row(head_gov.split()[-1])

    return pd.DataFrame(rows)

if __name__ == "__main__":
    df = fetch_country_data()
    
    output_path = "country_keywords.csv"
    df.to_csv(output_path, index=False)
    
    print(f"Saved {len(df)} keywords to {output_path}")