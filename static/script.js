document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsArea = document.getElementById('results-area');
    const suggestionsList = document.getElementById('suggestions-list');

    // --- Function to display search results ---
    function displayResults(results) {
        resultsArea.innerHTML = ''; // Clear previous results
        const displayedMakes = new Set(); // To track displayed makes

        if (results && results.length > 0) {
            results.forEach(result => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('result-item');

                // Example: Check and display make only once per result block
                if (result.model_year_text) {
                    const make = result.model_year_text.split(' ')[0]; // Extract the first word (make)
                    if (make && !displayedMakes.has(make)) {
                        const makeHeader = document.createElement('h2');
                        makeHeader.textContent = make;
                        resultDiv.appendChild(makeHeader);
                        displayedMakes.add(make);
                    }
                    const h3 = document.createElement('h3');
                    h3.textContent = result.model_year_text;
                    resultDiv.appendChild(h3);
                }

                const createDetailRow = (label, value, link = null) => {
                    if (!value) return;

                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${label}:</strong> `;

                    if (link) {
                        const a = document.createElement('a');
                        a.href = link;
                        a.textContent = value;
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        p.appendChild(a);
                    } else {
                        p.appendChild(document.createTextNode(value));
                    }
                    resultDiv.appendChild(p);
                };

                // Add details - Adjust these keys to match your data.json
                if (result.engine_oil) createDetailRow('Engine Oil', result.engine_oil, result.engine_oil_link);
                if (result.gearbox_oil) createDetailRow('Gearbox Oil', result.gearbox_oil, result.gearbox_oil_link);
                if (result.rear_axle_oil) createDetailRow('Rear Axle Oil', result.rear_axle_oil, result.rear_axle_oil_link);
                resultsArea.appendChild(resultDiv);
            });
        } else {
            resultsArea.innerHTML = '<p>No results found. Please try a more specific search.</p>';
        }
    }

    // --- Function to perform the search ---
    async function performSearch(query) {
        try {
            const response = await fetch('/api/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Search error:', error);
            resultsArea.innerHTML = `<p class="error">Search failed: ${error.message}</p>`;
        }
    }

    // --- Function to fetch and display auto-suggestions ---
    async function getSuggestions(query) {
        try {
            const response = await fetch(`/api/suggest/${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error(`HTTP error fetching suggestions! status: ${response.status}`);
            const data = await response.json();
            displaySuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            suggestionsList.innerHTML = '';
        }
    }

    // --- Function to display the auto-suggest list ---
    function displaySuggestions(suggestions) {
        suggestionsList.innerHTML = '';
        if (suggestions && (suggestions.makes.length > 0 || suggestions.models.length > 0)) {
            if (suggestions.makes.length > 0) {
                const makeHeader = document.createElement('div');
                makeHeader.classList.add('suggestion-header');
                makeHeader.textContent = 'Makes';
                suggestionsList.appendChild(makeHeader);
                suggestions.makes.forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item', 'make-suggestion');
                    suggestionItem.textContent = suggestion;
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = suggestion;
                        suggestionsList.innerHTML = '';
                        searchInput.focus();
                        performSearch(suggestion); // Perform search on selection
                    });
                    suggestionsList.appendChild(suggestionItem);
                });
            }

            if (suggestions.models.length > 0) {
                const modelHeader = document.createElement('div');
                modelHeader.classList.add('suggestion-header');
                modelHeader.textContent = 'Models';
                suggestionsList.appendChild(modelHeader);
                suggestions.models.forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item', 'model-suggestion');
                    suggestionItem.textContent = suggestion;
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = suggestion;
                        suggestionsList.innerHTML = '';
                        searchInput.focus();
                        performSearch(suggestion); // Perform search on selection
                    });
                    suggestionsList.appendChild(suggestionItem);
                });
            }
        }
    }

    // --- Event listener for the search button ---
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        } else {
            resultsArea.innerHTML = '<p>Please enter a car make and model to search.</p>';
        }
    });

    // --- Event listener for the search input (auto-suggest) ---
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        clearTimeout(debounceTimer);
        if (query.length >= 3) {
            debounceTimer = setTimeout(() => {
                getSuggestions(query);
            }, 300); // Debounce: Wait 300ms after typing
        } else {
            suggestionsList.innerHTML = ''; // Clear if less than 3 chars
        }
    });

    // --- Initial display of makes (if desired) ---
    const makeList = document.getElementById('make-list');
    if (makeList) {
        makeList.querySelectorAll('.make-item').forEach(item => {
            item.addEventListener('click', () => {
                searchInput.value = item.textContent;
                performSearch(item.textContent);
            });
        });
    }
});