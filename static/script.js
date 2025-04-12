// Sample car makes data - in a real application, this would come from a database or API
const carMakes = [
    "TALBOT",
    "TOYOTA",
    "TRABANT",
    "TRIUMPH",
    "TVR",
    "UNIPOWER",
    "VANDEN",
    "VAUXHALL",
    "VAUXHALL/OPEL",
    "VOLKSWAGEN",
    "WARTBURG",
    "WILLYS",
    "WOLSELEY",
    "ZASTAVA"
];

// Function to populate the car makes list
function populateCarMakesList() {
    const carMakesList = document.getElementById('car-makes-list');

    carMakes.forEach(make => {
        const listItem = document.createElement('li');
        const makeBox = document.createElement('div');

        makeBox.className = 'car-make-box';
        makeBox.textContent = make;

        listItem.appendChild(makeBox);
        carMakesList.appendChild(listItem);

        // Add click event to each make box
        makeBox.addEventListener('click', () => {
            document.getElementById('search-input').value = make;
        });
    });
}

// Sample car models data - this would come from a database in a real application
const carModels = {
    "TOYOTA": ["Corolla", "Camry", "RAV4", "Prius", "Land Cruiser"],
    "VOLKSWAGEN": ["Golf", "Passat", "Polo", "Tiguan", "Beetle"],
    // Add more makes and models as needed
};

// Function to show suggestions based on input
function showSuggestions(input) {
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';

    if (!input) {
        suggestionsList.style.display = 'none';
        return;
    }

    const inputLower = input.toLowerCase();
    let suggestions = [];

    // Check for make matches
    carMakes.forEach(make => {
        if (make.toLowerCase().includes(inputLower)) {
            suggestions.push(make);
        }
    });

    // Check for make+model matches
    for (const make in carModels) {
        carModels[make].forEach(model => {
            const fullName = `${make} ${model}`;
            if (fullName.toLowerCase().includes(inputLower)) {
                suggestions.push(fullName);
            }
        });
    }

    // Limit suggestions to top 10
    suggestions = suggestions.slice(0, 10);

    if (suggestions.length > 0) {
        suggestionsList.style.display = 'block';

        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                document.getElementById('search-input').value = suggestion;
                suggestionsList.style.display = 'none';

                // Optionally trigger search immediately
                // handleSearch();
            });
            suggestionsList.appendChild(div);
        });
    } else {
        suggestionsList.style.display = 'none';
    }
}

// Function to handle search
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.trim();
    const resultsArea = document.getElementById('results-area');

    if (searchTerm) {
        // In a real application, you would send this to your backend or API
        console.log(`Searching for: ${searchTerm}`);

        // Example of displaying results
        resultsArea.innerHTML = `
            <p>Searching for oil information for: <strong>${searchTerm}</strong></p>
            <p>Please wait while we find the recommended oil type...</p>
        `;

        // Simulate a search delay
        setTimeout(() => {
            resultsArea.innerHTML = `
                <p>Recommended oil for <strong>${searchTerm}</strong>:</p>
                <p>Engine Oil: 5W-30 Synthetic</p>
                <p>Oil Capacity: 4.5 liters</p>
                <p>Oil Change Interval: 10,000 km or 12 months</p>
            `;
        }, 1000);
    } else {
        resultsArea.innerHTML = '<p>Please enter a car make and model</p>';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsArea = document.getElementById('results-area');
    const suggestionsList = document.getElementById('suggestions-list');
    const carMakesList = document.getElementById('car-makes-list');

    // --- Function to fetch car makes and populate the list ---
    async function fetchAndPopulateCarMakes() {
        try {
            // Try to fetch makes from the API
            const response = await fetch('/api/makes');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const makes = await response.json();
            populateCarMakesList(makes);
        } catch (error) {
            console.error('Error fetching car makes:', error);
            // If API call fails, use a fallback list of popular makes
            const fallbackMakes = [
                "TALBOT", "TOYOTA", "TRABANT", "TRIUMPH", "TVR",
                "UNIPOWER", "VANDEN", "VAUXHALL", "VAUXHALL/OPEL",
                "VOLKSWAGEN", "WARTBURG", "WILLYS", "WOLSELEY", "ZASTAVA"
            ];
            populateCarMakesList(fallbackMakes);
        }
    }

    // --- Function to populate the car makes list ---
    function populateCarMakesList(makes) {
        if (!carMakesList) return;

        carMakesList.innerHTML = ''; // Clear existing list

        makes.forEach(make => {
            const listItem = document.createElement('li');
            const makeBox = document.createElement('div');

            makeBox.className = 'car-make-box';
            makeBox.textContent = make;

            // Add click event to each make box
            makeBox.addEventListener('click', () => {
                searchInput.value = make;
                performSearch(make);
            });

            listItem.appendChild(makeBox);
            carMakesList.appendChild(listItem);
        });
    }

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
            resultsArea.innerHTML = '<p>Searching...</p>'; // Show loading message

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

    // --- Event listener for Enter key in search input ---
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
                suggestionsList.innerHTML = ''; // Clear suggestions
            }
        }
    });

    // --- Initialize the page ---
    fetchAndPopulateCarMakes(); // Fetch and populate car makes list
});