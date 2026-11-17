# 🌍 Interactive Climate Change Dashboard

An advanced, data-driven web application designed to visualize, explore, and analyze global climate change patterns, greenhouse gas emissions, and environmental indicators across countries and major world regions.

Built using **Python, Data Preprocessing & EDA pipelines, HTML5, Modern CSS3, and JavaScript**, this platform converts multi-century climate datasets into intuitive, interactive visual insights and predictive simulation models.

---

## 📌 Executive Summary & Key Climate Indicators

| Indicator | Current Status | Baseline / Reference | Scientific Insight |
| :--- | :--- | :--- | :--- |
| **Global Land Temperature** | **+2.04°C** | 1850–1900 Pre-Industrial | Land warming has accelerated over **6.5x faster** since 1980 (+0.25°C/dec vs +0.038°C/dec in 1850). |
| **Combined Land & Ocean** | **+1.31°C** | 1850–1900 Pre-Industrial | Ocean heat absorption buffers warming, but drives thermal expansion and marine heatwaves. |
| **Atmospheric CO₂** | **425.2 ppm** | 277 ppm (Pre-Industrial) | **+51.8% increase** driven by fossil fuels and industrial activity (Mauna Loa Keeling curve). |
| **Annual Fossil Emissions** | **39.1 Gt CO₂/yr** | 0.03 Gt in 1800 | Coal (41%), Oil (33%), Gas (21%), Cement (4%), Flaring (1%). |
| **Global Mean Sea Level** | **+262 mm** | 1880 Benchmark | Current rise rate is **+3.7 mm/year** (satellite altimetry). |
| **Arctic Sea Ice Extent** | **4.28 M km²** | 7.67 M km² in 1980 | **-44.2% reduction** in September minimum extent due to polar amplification. |
| **1.5°C Carbon Budget** | **~250 Gt CO₂** | IPCC AR6 50% probability | Only **~5.9 years remaining** at current annual burn rate (~1,238 tonnes CO₂/sec). |

---

## 🚀 Key Features & Interactive Modules

### 1. 📊 Global Temperature Trends & "Show Your Stripes"
- **275-Year Trajectory (1750 – Present):** Interactive annual land temperature anomalies, 5-year moving averages, and combined land+ocean series.
- **Ed Hawkins Warming Stripes Barcode:** Visual representation of every year from 1850 to 2024 colored from deep blue (-1.5°C) to deep crimson (+2.0°C) with interactive year-by-year hover scrubbers.
- **Seasonal Cycle Shift:** Climatological comparison of monthly temperatures (Jan–Dec) contrasting 1951–1980 baseline vs the modern era.

### 2. 🏭 Emissions & Greenhouse Gases
- **Stacked Historical Area Chart:** 1900–2024 fossil emissions broken down into Coal, Oil, Natural Gas, Cement, and Gas Flaring.
- **Country Emissions & Carbon Intensity:** Comparative analysis of total territorial emissions (Megatonnes CO₂) vs per-capita emissions (tonnes CO₂/person) across China, USA, India, EU, Russia, Japan, and other nations.
- **Atmospheric GHG Composition:** 100-Year Global Warming Potential (GWP) shares of Carbon Dioxide (74.4%), Methane (17.3%), Nitrous Oxide (6.2%), and Fluorinated Gases (2.1%).
- **Economic Sector Attribution:** Emissions breakdown by Energy (34%), Industry (24%), Agriculture & Forestry (21%), Transportation (15%), and Buildings (6%).

### 3. 🌐 Regional & Country Comparison Tool
- **Multi-Country Selection:** Compare temperature anomalies and trends for any combination of 240+ countries.
- **Pre-Built Analytical Presets:** 
  - *Top Emitters* (China, USA, India, Russia)
  - *Fastest Warming* (Russia, Canada, Mongolia, Finland)
  - *Island Nations* (Indonesia, Philippines, Japan, UK)
  - *4 Continents* (Brazil, Egypt, Australia, Germany)
- **Detailed Statistical Table:** Pre-industrial baseline temp, modern mean temp, warming delta, and observational data range.

### 4. 🗺️ Interactive Climate Map (100 Major Global Stations)
- **Equirectangular Global Projection:** Maps all 100 major global cities from the Berkeley Earth station dataset with precise latitude and longitude.
- **Dynamic Color Intensity:** Visualizes station warming severity from moderate (< +1.0°C, cyan) to extreme (> +1.8°C, deep crimson).
- **Interactive Station Inspector:** Click any station to zoom in, view coordinates, historical baseline, modern temperature, and a mini-timeline chart.
- **Latitude Zone Filters:** Filter by High Latitudes (>50°), Temperate (23.5°–50°), Tropical (0°–23.5°), or High Warming (> +1.4°C).

### 5. 🔍 Human Attribution & Carbon Budget Clock
- **CO₂ vs Temperature Scatter & Linear Regression:** Direct correlation proving that atmospheric CO₂ explains **>73% of global temperature variance** ($R^2 = 0.733$, $p < 0.0001$).
- **Live Paris 1.5°C Carbon Budget Clock:** Real-time countdown tracking the remaining global carbon budget, updated every second based on global emission rates.

### 6. 🎛️ IPCC AR6 Climate Scenario Simulator
- **Interactive Trajectory Modeling:** Calculate projected 2100 temperature anomalies and sea level rise based on:
  - Global Peak Emissions Year (2024 to 2055)
  - Annual Decarbonization Rate (0% to 10%/year)
  - Equilibrium Climate Sensitivity (ECS: Low 2.2°C, Central 3.0°C, High 4.0°C per doubling CO₂)
- **Official IPCC Shared Socioeconomic Pathways (SSPs):** 1-click loading for SSP1-1.9 (Paris 1.5°C), SSP1-2.6 (Below 2°C), SSP2-4.5 (Current Policies), SSP3-7.0 (Regional Rivalry), and SSP5-8.5 (Fossil-Fueled Growth).

### 7. 📈 Exploratory Data Analysis (EDA) Hub
- **Descriptive Epoch Statistics:** Mean, variance, standard deviation, skewness, and excess kurtosis across 6 historical epochs.
- **Warming Acceleration Verification:** Rigorous mathematical proof that the modern warming rate (+0.248°C/decade) is 6.5x faster than early industrial rates.
- **Polar Amplification Proof:** Statistical proof that high-latitude stations warm up to 1.8x faster than tropical stations due to sea ice albedo loss.
- **Uncertainty Evolution Timeline:** Historical tracking of measurement confidence from early thermometer nets (±3.5°C) to satellite era (±0.04°C).

### 8. 🌱 Solutions & Take Action Center
- **Project Drawdown Impact Matrix:** Clean Energy, Transport Electrification, Reforestation & Land Sinks, Food Systems, Industrial Decarbonization, and Building Retrofits.
- **Action Hierarchy:** Quantified impact across Policy, Municipal, Enterprise, and Individual levels.

---

## 📸 Dashboard Preview & Interface Walkthrough

```
+-----------------------------------------------------------------------------------------------+
|  🌍 Interactive Climate Change Dashboard          [🟢 Berkeley Earth & IPCC AR6 Aligned]     |
+-----------------------------------------------------------------------------------------------+
|  [🌡️ Land Temp: +2.04°C] [☁️ CO2: 425.2 ppm] [🏭 Emissions: 39.1 Gt] [🌊 Sea Level: +262mm]  |
+-----------------------------------------------------------------------------------------------+
|  [📊 Global Trends] [🏭 Emissions] [🌐 Regional Explorer] [🗺️ Climate Map] [🎛️ Simulator]    |
+-----------------------------------------------------------------------------------------------+
|  📈 275-Year Temperature Anomaly Trajectory (1750 - 2024)                                    |
|     +2.0°C |                                                                     _.-'         |
|     +1.0°C |                                                          _..---'                 |
|      0.0°C |----------------------~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~                         |
|     -1.0°C |                                                                                  |
|            +--------------------------------------------------------------------------------- |
|             1750                 1850                 1950                     2024           |
|                                                                                               |
|  🎨 "Show Your Stripes" (Ed Hawkins Barcode)                                                  |
|     [🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟨🟨🟨🟧🟧🟧🟧🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥]              |
|     1850 (Cooler Pre-Industrial)                      2024 (Record Heat: +2.04°C)             |
+-----------------------------------------------------------------------------------------------+
|  🗺️ 100 Major Global Stations Heatmap   |   🎛️ IPCC AR6 2100 Policy Simulator                 |
|     • Tokyo (+1.4°C)   • London (+1.6°C)|      Peak Year: [====|===] 2028                     |
|     • Delhi (+1.1°C)   • Moscow (+2.1°C)|      Decarbonization: [======|] 4.5%/yr             |
|     • New York (+1.5°) • Sydney (+1.0°C)|      Result: +1.75°C (Within 2.0°C Guardrail)       |
+-----------------------------------------------------------------------------------------------+
```

The user interface features:
- **Atmospheric Dark/Neon Theme:** Glassmorphic cards with responsive layout and temperature-coded accents.
- **Dynamic Crosshair Tooltips:** Hovering over any chart point or warming stripe provides instant historical anomalies.
- **Interactive Multi-Country Filtering:** Dynamic selection across 240+ countries and territories.
- **Real-Time Carbon Clock:** Ticking live countdown of remaining $1.5^\circ\text{C}$ carbon budget.

---

## 🛠️ Architecture & Technologies

```
project - i/
├── app.py                         # Application Web Server & REST API Router (Zero-Dependency)
├── preprocess_data.py             # Data Ingestion, Cleaning & Transformation Pipeline
├── eda_analysis.py                # Exploratory Data Analysis & Statistical Analytics
├── index.html                     # Root Web Interface
├── templates/
│   └── index.html                 # Template Interface
├── static/
│   ├── css/
│   │   └── style.css              # Modern Atmospheric UI Theme (Glassmorphism, Dark Mode)
│   ├── js/
│   │   ├── app.js                 # Master State Controller & Event Orchestrator
│   │   ├── charts.js              # Native High-DPI Canvas & SVG Charting Engine
│   │   ├── map.js                 # World Map & Climate Station Heatmap Visualizer
│   │   └── simulator.js           # IPCC Climate Projection Simulator Engine
│   └── data/                      # Cleaned, Optimized JSON Datasets
│       ├── global_climate.json
│       ├── countries_summary.json
│       ├── cities_summary.json
│       ├── emissions_ghg.json
│       ├── environmental_indicators.json
│       └── eda_metrics.json
├── run_dashboard.bat              # One-Click Windows Launcher
└── requirements.txt               # Dependencies Reference
```

- **Backend:** Python 3.8+ (Pure standard library implementation with zero external runtime dependencies required).
- **Frontend:** HTML5, CSS3 Custom Properties, Modern JavaScript (ES6+).
- **Charting & Graphics:** Native HTML5 Canvas 2D and SVG rendering with HiDPI support and interactive tooltips.
- **Data Preprocessing:** Python data pipelines processing over 800,000 Berkeley Earth observational records.

---

## 🚦 Quick Start Guide

### Option 1: Quick Launch (Windows)
Double-click `run_dashboard.bat`. It will verify data assets and open the dashboard in your default browser.

### Option 2: Run via Terminal
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   python app.py --port 8000
   ```
2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:8000/
   ```

### Option 3: Re-run Preprocessing & EDA
If you want to re-generate the processed JSON datasets from raw CSV files:
```powershell
python preprocess_data.py
python eda_analysis.py
```

---

## 📡 REST API Reference

The Python backend serves a full REST API for programmatic data access:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Health check, version info, and loaded dataset summary. |
| `/api/global-trends` | `GET` | Yearly temperature series (1750–2024), anomalies, and warming stripes. |
| `/api/emissions` | `GET` | Fossil CO₂ emissions by fuel, top countries, and GHG composition. |
| `/api/indicators` | `GET` | Sea level rise, Arctic sea ice extent, and carbon budget metrics. |
| `/api/countries` | `GET` | List of 240+ countries with baseline and recent warming deltas. |
| `/api/country/<name>` | `GET` | Historical timeline and statistics for a specific country. |
| `/api/cities` | `GET` | 100 major global cities with coordinates and warming statistics. |
| `/api/city/<name>` | `GET` | Monthly climatology and annual timeline for a specific city. |
| `/api/eda` | `GET` | Descriptive statistics, warming rates, correlation matrix, and polar gradient. |
| `/api/projections` | `GET` | Dynamic simulation query parameters: `?peak_year=2030&reduction_rate=3.5`. |

---

## 📚 Data Sources & Attribution
- **Berkeley Earth Surface Temperature:** Comprehensive global land and major city station records.
- **NOAA Global Monitoring Laboratory (Mauna Loa):** Atmospheric CO₂ Keeling Curve.
- **Law Dome Ice Core (Etheridge et al.):** Historical pre-industrial CO₂ record.
- **Global Carbon Project (Friedlingstein et al. 2024):** Territorial and sectoral fossil fuel emissions.
- **IPCC Sixth Assessment Report (AR6):** Shared Socioeconomic Pathways (SSPs), radiative forcings, and global carbon budgets.
- **NASA GISS & CSIRO:** Satellite altimetry global sea level rise.
- **NSIDC (National Snow and Ice Data Center):** Arctic sea ice minimum extent.
