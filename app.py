import json
import traceback
from flask import Flask, render_template, jsonify, request
from collections import defaultdict
import re  # Import regular expressions for slightly better filtering

# Initialize the Flask application
app = Flask(__name__)

# --- Load Raw Data ---
def load_raw_data():
    """Loads the raw data from data.json without complex pre-processing."""
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            if not isinstance(raw_data, dict):
                print("Error: Root of data.json is not a dictionary.")
                return None
            print(f"Successfully loaded {len(raw_data)} top-level keys from data.json.")
            return raw_data
    except FileNotFoundError:
        print("Error: data.json not found!")
        return None
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode data.json. Invalid JSON: {e!r}")
        return None
    except Exception as e:
        print(f"An critical error occurred during data loading: {e!r}")
        traceback.print_exc()
        return None

# Load data when the app starts
RAW_CAR_DATA = load_raw_data()

# --- Create Initial Make List (Crude extraction from keys) ---
def get_initial_makes(raw_data):
    """Generates a list of potential makes based on raw data keys."""
    if not raw_data:
        return []

    potential_makes = set()
    # Basic patterns to identify likely makes (customize if needed)
    # Simple guess: First word if it seems reasonable (e.g., not just a number)
    for key in raw_data.keys():
        parts = key.split()
        if parts:
            first_word = parts[0].upper()
            # Avoid short numeric strings or single letters unless common (AC, MG)
            if first_word.isdigit() or (len(first_word) < 2 and first_word not in ['AC','MG']):
                continue

            # Rudimentary check for multi-word - very basic
            # You could add more known multi-word prefixes here if essential
            if len(parts) > 1:
                 two_words = f"{parts[0].upper()} {parts[1].upper()}"
                 if two_words in ["ALFA ROMEO", "LAND ROVER", "ROLLS ROYCE", "ASTON MARTIN", "MERCEDES BENZ", "AUSTIN HEALEY"]:
                     potential_makes.add(two_words)
                     continue # Skip adding the single word if multi-word found

            potential_makes.add(first_word)

    return sorted(list(potential_makes))

SORTED_MAKES_FOR_UI = get_initial_makes(RAW_CAR_DATA)
print(f"Derived {len(SORTED_MAKES_FOR_UI)} potential makes for UI list.")

# --- Flask Routes (Search Raw Data) ---

@app.route('/')
def index():
    """Renders the main page, passing the derived list of makes."""
    return render_template('index.html', makes=SORTED_MAKES_FOR_UI)

@app.route('/api/models/<make>')
def get_models(make):
    """
    API: Finds relevant original model keys matching the selected make.
    Searches the keys of the raw data on each request.
    """
    if not RAW_CAR_DATA:
        return jsonify([])

    models = []
    make_upper = make.upper()
    # Basic check: does the original key start with the make name?
    for original_key in RAW_CAR_DATA.keys():
        key_upper = original_key.upper()
        # Handle multi-word makes slightly better
        if ' ' in make_upper: # e.g., "ALFA ROMEO"
             if key_upper.startswith(make_upper):
                  # Avoid adding the make key itself if it exists (e.g. "ALFA ROMEO")
                  if key_upper != make_upper:
                      models.append(original_key)
        else: # Single word make
             # Check if key starts with "MAKE " or is exactly "MAKE" (but avoid adding make itself)
             if key_upper.startswith(make_upper + ' ') or key_upper == make_upper:  # Modified line
                  models.append(original_key)

    # Filter out keys that look *only* like the make name itself
    # (e.g. prevent "FORD" key appearing when make="FORD")
    # This is imperfect because model keys might ALSO be just "FORD" in bad data
    filtered_models = [m for m in models if m.strip().upper() != make_upper]

    # If filtering removed everything, or if the filtered list is the same as the original,
    # return the original list. This is a more robust approach.
    if not filtered_models or len(filtered_models) == len(models):
        return jsonify(sorted(list(set(models))))
    else:
        return jsonify(sorted(list(set(filtered_models))))

@app.route('/api/years/<make>/<path:model_key>')
# model_key is the original key selected from the model dropdown
def get_years(make, model_key):
    """
    API: Returns the original year range keys directly from the raw data.
    """
    if not RAW_CAR_DATA:
        return jsonify([])

    # Get the year data directly using the original key
    year_data_dict = RAW_CAR_DATA.get(model_key)

    if isinstance(year_data_dict, dict):
        # Keys of this dict are the original year range keys
        years = sorted(list(year_data_dict.keys()))
        return jsonify(years)
    else:
        # Value associated with model_key is not a dictionary of years
        print(f"Error: Data for model key '{model_key}' is not a dictionary. Cannot get years.")
        return jsonify([])

@app.route('/api/details', methods=['POST'])  # Changed route definition
def search_details():
    """
    API: Searches for car details based on a query string.
    This is a simplified example and needs adaptation!
    """
    if not RAW_CAR_DATA:
        return jsonify({"error": "Car data not loaded"}), 500

    try:
        data = request.get_json()  # Get the JSON data from the request
        query = data.get('query', '').lower()  # Safely get the query, default to empty string
    except:
        return jsonify({"error": "Invalid request format"}), 400

    if not query:
        return jsonify([]), 400  # Bad request if no query

    results = []

    for make, models in RAW_CAR_DATA.items():
        for model, years in models.items():
            for year, details in years.items():
                full_text = f"{make} {model} {year}".lower() # Combine make, model, year for search
                if query in full_text:
                    results.append(details) # Append the whole details dictionary

    return jsonify(results)


@app.route('/api/suggest/<query>')
def get_suggestions(query):
    """
    API: Returns a list of make/model suggestions based on the query,
    categorized into 'makes' and 'models'.
    """
    if not RAW_CAR_DATA:
        return jsonify({"makes": [], "models": []})

    query_lower = query.lower()
    make_suggestions = []
    model_suggestions = []

    for make, models in RAW_CAR_DATA.items():
        if query_lower in make.lower():
            make_suggestions.append(make)
        for model_name in models.keys():
            if query_lower in model_name.lower():
                model_suggestions.append(f"{make} {model_name}")

    return jsonify({"makes": list(set(make_suggestions))[:5], "models": list(set(model_suggestions))[:5]})

# --- Run the Flask Development Server ---
if __name__ == '__main__':
    app.run(debug=True) # Remember to set debug=False for production