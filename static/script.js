document.addEventListener('DOMContentLoaded', () => {
    // Get references to the select elements and results area
    const makeSelect = document.getElementById('make-select');
    const modelSelect = document.getElementById('model-select');
    const yearSelect = document.getElementById('year-select');
    const resultsArea = document.getElementById('results-area');

    // --- Helper function to clear options and disable a select element ---
    function resetSelect(selectElement, defaultOptionText) {
        selectElement.innerHTML = `<option value="">-- ${defaultOptionText} --</option>`;
        selectElement.disabled = true;
    }

    // --- Helper function to populate a select element with options ---
    function populateSelect(selectElement, items) {
        // Reset select preserving the placeholder text logic
        resetSelect(selectElement, selectElement.firstElementChild.textContent.slice(3, -3));
        if (items && items.length > 0) {
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item;       // Set the value (used internally)
                option.textContent = item; // Set the text displayed to the user
                selectElement.appendChild(option);
            });
            selectElement.disabled = false; // Enable the select dropdown
        } else {
             // Keep disabled state from resetSelect, update placeholder
             selectElement.innerHTML = `<option value="">-- No options available --</option>`;
             selectElement.disabled = true;
        }
    }

     // --- Helper function to display the final oil/fluid details ---
    function displayResults(data) {
        resultsArea.innerHTML = ''; // Clear previous results or "Loading..." message

        if (data && !data.error) {
            // Function to create a paragraph row for a detail item
            const createDetailRow = (label, value, link = null) => {
                if (!value) return; // Don't display if value is empty or null

                const p = document.createElement('p');
                p.innerHTML = `<strong>${label}:</strong> `; // Use innerHTML for bold tag

                // Check if it's a valid link and not a 'Consult...' message
                const isConsultMessage = typeof value === 'string' && value.toLowerCase().startsWith('consult');
                if (link && !isConsultMessage) {
                    const a = document.createElement('a');
                    a.href = link;
                    a.textContent = value;
                    a.target = "_blank"; // Open link in a new tab
                    a.rel = "noopener noreferrer"; // Security measure for target="_blank"
                    p.appendChild(a); // Append the link element
                } else {
                    p.appendChild(document.createTextNode(value)); // Append value as plain text
                }
                resultsArea.appendChild(p);
            };

             // Add details - Customize this section based on the actual keys in your JSON
             // Make sure the keys ('model_year_text', 'engine_oil', etc.) match your data.json exactly
             if (data.model_year_text) createDetailRow('Vehicle', data.model_year_text);
             if (data.engine_oil) createDetailRow('Engine Oil', data.engine_oil, data.engine_oil_link);
             if (data.engine_oil_notes) createDetailRow('Engine Oil Notes', data.engine_oil_notes); // Example notes field
             if (data.gearbox_oil) createDetailRow('Gearbox Oil', data.gearbox_oil, data.gearbox_oil_link);
             if (data.gearbox_oil_notes) createDetailRow('Gearbox Oil Notes', data.gearbox_oil_notes); // Example notes field
             if (data.diff_oil) createDetailRow('Differential Oil', data.diff_oil, data.diff_oil_link); // Example field
             if (data.rear_axle_oil) createDetailRow('Rear Axle Oil', data.rear_axle_oil, data.rear_axle_oil_link); // Pass link if available
             if (data.pas_fluid) createDetailRow('Power Steering Fluid', data.pas_fluid, data.pas_fluid_link); // Example field
             if (data.brake_fluid) createDetailRow('Brake Fluid', data.brake_fluid, data.brake_fluid_link); // Example field
             if (data.coolant) createDetailRow('Coolant', data.coolant, data.coolant_link); // Example field

             // Add any other fields you want to display from your JSON details object...

        } else if (data && data.error) {
            // Display specific error message from the API if available
            resultsArea.innerHTML = `<p class="error">Error: ${data.error}</p>`;
        } else {
            // Default message if no selection made or other issue
            resultsArea.innerHTML = '<p>Please select make, model, and year range to see details.</p>';
        }
    }

    // --- Event Listeners for Dropdown Changes ---

    // When Make dropdown selection changes
    makeSelect.addEventListener('change', async () => {
        const selectedMake = makeSelect.value;
        // Reset subsequent dropdowns and results area
        resetSelect(modelSelect, 'Select Model');
        resetSelect(yearSelect, 'Select Year Range');
        resultsArea.innerHTML = '<p>Please make your selections above.</p>';

        if (selectedMake) { // Proceed only if a make is selected
            try {
                // Fetch the list of models for the selected make from the API
                const response = await fetch(`/api/models/${encodeURIComponent(selectedMake)}`);
                if (!response.ok) throw new Error(`HTTP error fetching models! status: ${response.status}`);
                const models = await response.json();

                // Log the API response for debugging
                console.log(`API response for models (${selectedMake}):`, models);

                // Populate the Model select dropdown with the received models
                populateSelect(modelSelect, models);
            } catch (error) {
                console.error('Error fetching models:', error);
                resultsArea.innerHTML = '<p class="error">Could not load models. Please try again.</p>';
            }
        }
    });

    // When Model dropdown selection changes
    modelSelect.addEventListener('change', async () => {
        const selectedMake = makeSelect.value;
        const selectedModel = modelSelect.value;
        // Reset the year dropdown and results area
        resetSelect(yearSelect, 'Select Year Range');
        resultsArea.innerHTML = '<p>Please make your selections above.</p>';

        if (selectedMake && selectedModel) { // Proceed only if both make and model are selected
            try {
                // Fetch the list of year ranges for the selected make and model
                const response = await fetch(`/api/years/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}`);
                if (!response.ok) throw new Error(`HTTP error fetching years! status: ${response.status}`);
                const years = await response.json();

                // *** Log the API response for debugging the years dropdown ***
                console.log(`API response for years (${selectedModel}):`, years);
                // *************************************************************

                // Populate the year select dropdown with the received year ranges
                populateSelect(yearSelect, years);
            } catch (error) {
                console.error('Error fetching years:', error);
                resultsArea.innerHTML = '<p class="error">Could not load year ranges. Please try again.</p>';
            }
        }
    });

    // When Year dropdown selection changes
    yearSelect.addEventListener('change', async () => {
        const selectedMake = makeSelect.value;
        const selectedModel = modelSelect.value;
        const selectedYear = yearSelect.value;
        resultsArea.innerHTML = '<p>Loading details...</p>'; // Show loading message

        if (selectedMake && selectedModel && selectedYear) { // Proceed only if all three are selected
            try {
                // Fetch the detailed information for the selected combination
                const response = await fetch(`/api/details/${encodeURIComponent(selectedMake)}/${encodeURIComponent(selectedModel)}/${encodeURIComponent(selectedYear)}`);
                if (!response.ok) {
                    // Try to get error message from API response if possible
                    let errorData = { error: `HTTP error! status: ${response.status}` };
                    try {
                        errorData = await response.json();
                    } catch(e) { /* Ignore if response is not JSON */ }
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const details = await response.json();

                // Display the fetched details in the results area
                displayResults(details);
            } catch (error) {
                console.error('Error fetching details:', error);
                resultsArea.innerHTML = `<p class="error">Could not load details: ${error.message}. Please try again.</p>`;
            }
        } else {
            // Update results area if year is deselected or invalid
            resultsArea.innerHTML = '<p>Please select a year range to see details.</p>';
        }
    });
}); // End of DOMContentLoaded listener