import json

# Replace with your actual filename
FILENAME = 'world-countries.geojson'

def extract_geojson_ids(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extracting 'id' from the feature level
        ids = []
        features = data.get('features', [])
        
        for feature in features:
            feat_id = feature.get('properties', {}).get('ISO3166-1-Alpha-3')
            
            # Filtering out the '-99' malformed codes
            if feat_id and feat_id != "-99":
                ids.append(feat_id)
        
        # Sort for easier manual verification
        ids.sort()
        
        print(f"--- Extracted {len(ids)} valid ISO-A3 codes ---")
        
        # Format for SQL: 'AFG', 'ALB', 'DZA'...
        sql_list = ", ".join([f"'{i}'" for i in ids])
        print("\nSQL-ready list:\n")
        print(sql_list)
        
        return ids

    except FileNotFoundError:
        print(f"Error: {filepath} not found.")
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON. Check the file format.")

if __name__ == "__main__":
    extract_geojson_ids(FILENAME)