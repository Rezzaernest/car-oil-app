document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const navContainer = document.querySelector(".nav-container")

  if (mobileMenuBtn && navContainer) {
    mobileMenuBtn.addEventListener("click", () => {
      navContainer.classList.toggle("active")
    })
  }

  // Define elements
  const searchInput = document.getElementById("search-input")
  const searchButton = document.getElementById("search-button")
  const resultsArea = document.getElementById("results-area")
  const suggestionsList = document.getElementById("suggestions-list")
  const makeList = document.getElementById("make-list")
  const showMoreBtn = document.getElementById("show-more-btn")

  let expandedMakesList = false
  let carData = null // Store the loaded data
  let allMakes = [] // Store all makes
  let allModels = {} // Store all models by make for auto-suggestions
  let sitemapData = null // Store the parsed sitemap data

  // Toggle brands section height
  if (showMoreBtn && makeList) {
    showMoreBtn.addEventListener("click", () => {
      if (!expandedMakesList) {
        makeList.style.maxHeight = "none"
        showMoreBtn.textContent = "Show Less"
      } else {
        makeList.style.maxHeight = "600px"
        showMoreBtn.textContent = "Show More"
      }
      expandedMakesList = !expandedMakesList
    })
  }

  // Populate makes grid
  function populateMakesGrid(makes) {
    if (!makeList) return

    makeList.innerHTML = ""

    // Display all makes
    makes.forEach((make) => {
      const makeItem = document.createElement("div")
      makeItem.classList.add("make-item")
      // Display makes in uppercase to match the screenshot
      makeItem.textContent = make.toUpperCase()
      makeItem.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = make
          performSearch(make)
        }
      })
      makeList.appendChild(makeItem)
    })

    // Show/hide "Show More" button based on number of makes
    if (showMoreBtn) {
      if (makes.length <= 18) {
        showMoreBtn.style.display = "none"
      } else {
        showMoreBtn.style.display = "block"
      }
    }
  }

  // Format make name for better display (Title Case)
  function formatMakeName(make) {
    return make
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  // Function to load sitemap from Shopify directly
  async function loadSitemap() {
    try {
      console.log("Attempting to load sitemap from Shopify...")

      // Use the direct Shopify sitemap URL
      const sitemapUrl = "https://www.castrolclassic.co.za/sitemap_products_1.xml?from=7745608351789&to=8083098927149"

      // Use a CORS proxy if needed (for local development)
      // const corsProxy = "https://cors-anywhere.herokuapp.com/"
      // const response = await fetch(corsProxy + sitemapUrl)

      // For production, you might need to handle this server-side or use a different approach
      // For now, we'll use a hardcoded mapping of product slugs to URLs based on the sitemap

      console.log("Using pre-defined product mapping from sitemap")

      // Create a mapping of product slugs to URLs based on the sitemap
      const productUrls = {
        xl30: "https://www.castrolclassic.co.za/products/classic-xl30",
        "classic-xl30": "https://www.castrolclassic.co.za/products/classic-xl30",
        xxl40: "https://www.castrolclassic.co.za/products/classic-xxl40",
        "classic-xxl40": "https://www.castrolclassic.co.za/products/classic-xxl40",
        xl20w50: "https://www.castrolclassic.co.za/products/castrol-classic-xl-20w50-1l",
        "xl-20w50": "https://www.castrolclassic.co.za/products/castrol-classic-xl-20w50-1l",
        "xl20w-50": "https://www.castrolclassic.co.za/products/castrol-classic-xl-20w50-1l",
        "xl-20w-50": "https://www.castrolclassic.co.za/products/castrol-classic-xl-20w50-1l",
        ep90: "https://www.castrolclassic.co.za/products/classic-ep90",
        "classic-ep90": "https://www.castrolclassic.co.za/products/classic-ep90",
        ep140: "https://www.castrolclassic.co.za/products/classic-ep140",
        "classic-ep140": "https://www.castrolclassic.co.za/products/classic-ep140",
        d140: "https://www.castrolclassic.co.za/products/classic-d140",
        "classic-d140": "https://www.castrolclassic.co.za/products/classic-d140",
        st90: "https://www.castrolclassic.co.za/products/classic-st90",
        "classic-st90": "https://www.castrolclassic.co.za/products/classic-st90",
        tqf: "https://www.castrolclassic.co.za/products/classic-tqf",
        "classic-tqf": "https://www.castrolclassic.co.za/products/classic-tqf",
        gp50: "https://www.castrolclassic.co.za/products/classic-gp50",
        "classic-gp50": "https://www.castrolclassic.co.za/products/classic-gp50",
        r40: "https://www.castrolclassic.co.za/products/castrol-r40",
        "castrol-r40": "https://www.castrolclassic.co.za/products/castrol-r40",
        ep80w: "https://www.castrolclassic.co.za/products/transmax-manual-ep80w",
        "manual-ep80w": "https://www.castrolclassic.co.za/products/transmax-manual-ep80w",
        "gtx-10w-40": "https://www.castrolclassic.co.za/products/castrol-gtx-classic-10w-40-5l",
        "gtx-10w40": "https://www.castrolclassic.co.za/products/castrol-gtx-classic-10w-40-5l",
      }

      console.log("Product mapping loaded with", Object.keys(productUrls).length, "products")
      return productUrls
    } catch (error) {
      console.error("Error loading sitemap:", error)
      return {}
    }
  }

  // Function to load data.json
  async function loadCarData() {
    try {
      // Try to fetch data.json
      const response = await fetch("data/data.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Store the data for later use
      carData = data

      // Extract makes from the data (top-level keys)
      const makes = Object.keys(data)
      allMakes = makes.sort()

      // Extract all models by make for auto-suggestions
      allModels = {}
      for (const make in data) {
        allModels[make] = Object.keys(data[make])
      }

      return makes.sort()
    } catch (error) {
      console.error("Error loading car data:", error)
      // Fallback to hardcoded makes if data.json can't be loaded
      return ["AC", "ALFA ROMEO", "ASTON MARTIN", "AUDI", "BENTLEY", "BMW"]
    }
  }

  // Setup auto-suggestions
  function setupAutoSuggestions() {
    if (!searchInput || !suggestionsList) return

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase()

      if (query.length < 2) {
        suggestionsList.style.display = "none"
        return
      }

      // Filter makes that match the query
      const matchingMakes = allMakes.filter((make) => make.toLowerCase().includes(query)).slice(0, 3) // Limit to 3 make suggestions

      // Find matching models
      let matchingModels = []
      for (const make in allModels) {
        if (make.toLowerCase().includes(query)) {
          // If make matches, show some of its models
          matchingModels = matchingModels.concat(allModels[make].slice(0, 3).map((model) => ({ make, model })))
        } else {
          // Check if any models match
          const models = allModels[make].filter((model) => model.toLowerCase().includes(query)).slice(0, 2)

          matchingModels = matchingModels.concat(models.map((model) => ({ make, model })))
        }
      }

      // Limit total models
      matchingModels = matchingModels.slice(0, 5)

      if (matchingMakes.length > 0 || matchingModels.length > 0) {
        suggestionsList.innerHTML = ""

        // Add makes section if there are matching makes
        if (matchingMakes.length > 0) {
          const makesHeader = document.createElement("div")
          makesHeader.classList.add("suggestion-category")
          makesHeader.textContent = "Makes"
          suggestionsList.appendChild(makesHeader)

          matchingMakes.forEach((make) => {
            const item = document.createElement("div")
            item.classList.add("suggestion-item")
            // Use car icon and format make name with first letter capitalized
            item.innerHTML = `<i class="fas fa-car"></i> ${formatMakeName(make)}`
            item.addEventListener("click", () => {
              searchInput.value = make
              suggestionsList.style.display = "none"
              performSearch(make)
            })
            suggestionsList.appendChild(item)
          })
        }

        // Add models section if there are matching models
        if (matchingModels.length > 0) {
          const modelsHeader = document.createElement("div")
          modelsHeader.classList.add("suggestion-category")
          modelsHeader.textContent = "Models"
          suggestionsList.appendChild(modelsHeader)

          matchingModels.forEach(({ make, model }) => {
            const item = document.createElement("div")
            item.classList.add("suggestion-item")
            // Use car-side icon and display model in uppercase to match the screenshot
            item.innerHTML = `<i class="fas fa-car-side"></i> ${formatMakeName(make)} ${model.toUpperCase()}`
            item.addEventListener("click", () => {
              searchInput.value = `${make} ${model}`
              suggestionsList.style.display = "none"
              performSearch(`${make} ${model}`)
            })
            suggestionsList.appendChild(item)
          })
        }

        suggestionsList.style.display = "block"
      } else {
        suggestionsList.style.display = "none"
      }
    })

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target !== searchInput && e.target !== suggestionsList) {
        suggestionsList.style.display = "none"
      }
    })
  }

  // Format oil type for search by adding spaces between letters and numbers
  function formatOilTypeForSearch(oilType) {
    if (!oilType) return ""

    // Add spaces between letters and numbers
    // For example: "XL30" becomes "XL 30", "XL20W50" becomes "XL 20W 50"
    return oilType.replace(/([a-zA-Z])(\d)/g, "$1 $2").replace(/(\d)([a-zA-Z])/g, "$1 $2")
  }

  // Find direct product URL from sitemap or use search URL as fallback
  function generateProductUrl(oilType) {
    if (!oilType) return null

    // Don't generate links for consultation messages
    if (oilType.includes("Consult") || oilType.includes("consult")) {
      return null
    }

    // Format oil type for search by adding spaces between letters and numbers
    const formattedOilType = formatOilTypeForSearch(oilType)

    // Try to find a direct product URL in the sitemap
    if (sitemapData) {
      // Create variations of the oil type to check against the sitemap
      const variations = [
        oilType
          .toLowerCase()
          .replace(/\s+/g, ""), // xl30
        oilType
          .toLowerCase()
          .replace(/\s+/g, "-"), // xl-30
        oilType
          .toLowerCase()
          .replace(/\//g, "-")
          .replace(/\s+/g, "-"), // xl-20w-50
        "classic-" + oilType.toLowerCase().replace(/\s+/g, "-"), // classic-xl-30
        formattedOilType
          .toLowerCase()
          .replace(/\s+/g, ""), // xl30
        formattedOilType
          .toLowerCase()
          .replace(/\s+/g, "-"), // xl-30
        "classic-" + formattedOilType.toLowerCase().replace(/\s+/g, "-"), // classic-xl-30
      ]

      // Check if any variation exists in the sitemap
      for (const variation of variations) {
        if (sitemapData[variation]) {
          console.log(`Found direct product URL for ${oilType}: ${sitemapData[variation]}`)
          return sitemapData[variation]
        }
      }
    }

    // Fallback to search URL if no direct product URL is found
    console.log(`No direct product URL found for ${oilType}, using search URL`)
    return `https://www.castrolclassic.co.za/search?q=${encodeURIComponent(formattedOilType)}`
  }

  // Display search results with product links
  function displayResults(results) {
    if (!resultsArea) return

    resultsArea.innerHTML = "" // Clear previous results

    if (results && results.length > 0) {
      results.forEach((result) => {
        const resultDiv = document.createElement("div")
        resultDiv.classList.add("result-item")

        const h3 = document.createElement("h3")
        h3.textContent = result.model_year_text || "Car Details"
        resultDiv.appendChild(h3)

        // Add year range if available
        if (result.year_range) {
          const yearP = document.createElement("p")
          yearP.innerHTML = `<strong>Year Range:</strong> ${result.year_range}`
          resultDiv.appendChild(yearP)
        }

        // Add oil details with buy links
        if (result.engine_oil) {
          const p = document.createElement("p")
          p.innerHTML = `<strong>Engine Oil:</strong> ${result.engine_oil}`

          // Only add buy link if it's not a consultation message
          if (!result.engine_oil.includes("Consult")) {
            // Generate product URL based on oil type, not the broken link
            const productUrl = generateProductUrl(result.engine_oil)

            if (productUrl) {
              const buyLink = document.createElement("a")
              buyLink.href = productUrl
              buyLink.className = "buy-now-link"
              buyLink.innerHTML =
                'Buy Now <i class="fas fa-external-link-alt" style="margin-left: 5px; font-size: 0.8em;"></i>'
              buyLink.target = "_blank"
              p.appendChild(buyLink)
            }
          }

          resultDiv.appendChild(p)
        }

        if (result.gearbox_oil) {
          const p = document.createElement("p")
          p.innerHTML = `<strong>Gearbox Oil:</strong> ${result.gearbox_oil}`

          // Only add buy link if it's not a consultation message
          if (!result.gearbox_oil.includes("Consult")) {
            // Generate product URL based on oil type, not the broken link
            const productUrl = generateProductUrl(result.gearbox_oil)

            if (productUrl) {
              const buyLink = document.createElement("a")
              buyLink.href = productUrl
              buyLink.className = "buy-now-link"
              buyLink.innerHTML =
                'Buy Now <i class="fas fa-external-link-alt" style="margin-left: 5px; font-size: 0.8em;"></i>'
              buyLink.target = "_blank"
              p.appendChild(buyLink)
            }
          }

          resultDiv.appendChild(p)
        }

        if (result.rear_axle_oil) {
          const p = document.createElement("p")
          p.innerHTML = `<strong>Rear Axle Oil:</strong> ${result.rear_axle_oil}`

          // Only add buy link if it's not a consultation message
          if (!result.rear_axle_oil.includes("Consult")) {
            // Generate product URL based on oil type, not the broken link
            const productUrl = generateProductUrl(result.rear_axle_oil)

            if (productUrl) {
              const buyLink = document.createElement("a")
              buyLink.href = productUrl
              buyLink.className = "buy-now-link"
              buyLink.innerHTML =
                'Buy Now <i class="fas fa-external-link-alt" style="margin-left: 5px; font-size: 0.8em;"></i>'
              buyLink.target = "_blank"
              p.appendChild(buyLink)
            }
          }

          resultDiv.appendChild(p)
        }

        resultsArea.appendChild(resultDiv)
      })
    } else {
      resultsArea.innerHTML = "<p>No results found. Please try a more specific search.</p>"
    }
  }

  // Search function that uses data.json
  function searchCarData(query) {
    if (!carData) return []

    const results = []
    const queryLower = query.toLowerCase()

    // Search through the data structure
    for (const make in carData) {
      const makeData = carData[make]

      // Check if the make matches the query
      const makeMatches = make.toLowerCase().includes(queryLower)

      for (const model in makeData) {
        // Check if the model matches the query
        const modelMatches = model.toLowerCase().includes(queryLower)

        // Check if the combined make+model matches the query
        const combinedMatches = `${make} ${model}`.toLowerCase().includes(queryLower)

        for (const yearRange in makeData[model]) {
          const details = makeData[model][yearRange]

          // Add to results if make or model matches
          if (
            makeMatches ||
            modelMatches ||
            combinedMatches ||
            (details.model_year_text && details.model_year_text.toLowerCase().includes(queryLower))
          ) {
            results.push(details)
          }
        }
      }
    }

    return results
  }

  // Perform search
  function performSearch(query) {
    if (!resultsArea) return

    try {
      // Show loading indicator
      resultsArea.innerHTML = "<p>Searching for oil information...</p>"

      // Search the data
      const results = searchCarData(query)

      // Scroll to results
      document.querySelector(".results-section")?.scrollIntoView({ behavior: "smooth" })

      // Display results
      displayResults(results)
    } catch (error) {
      console.error("Search error:", error)
      if (resultsArea) {
        resultsArea.innerHTML = `<p class="error">Search failed: ${error.message}</p>`
      }
    }
  }

  // Initialize
  async function initialize() {
    try {
      // Load sitemap data first
      console.log("Starting initialization...")
      console.log("Loading sitemap data...")
      sitemapData = await loadSitemap()
      console.log("Sitemap loaded with", Object.keys(sitemapData).length, "products")

      // Load car data and populate makes grid
      console.log("Loading car data...")
      const makes = await loadCarData()
      console.log("Car data loaded with", makes.length, "makes")
      populateMakesGrid(makes)

      // Setup auto-suggestions
      setupAutoSuggestions()

      // Add search button click handler
      if (searchButton) {
        searchButton.addEventListener("click", () => {
          if (searchInput) {
            const query = searchInput.value.trim()
            if (query) {
              performSearch(query)
            } else if (resultsArea) {
              resultsArea.innerHTML = "<p>Please enter a car make and model to search.</p>"
            }
          }
        })
      }

      // Add search input enter key handler
      if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            const query = searchInput.value.trim()
            if (query) {
              performSearch(query)
            }
          }
        })
      }
    } catch (error) {
      console.error("Initialization error:", error)
      alert("There was an error initializing the application. Please check the console for details.")
    }
  }

  // Start the application
  initialize()
})
