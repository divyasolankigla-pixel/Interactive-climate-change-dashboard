# 📄 Comprehensive Project Report: Interactive Climate Change Dashboard

**Project Title:** Interactive Climate Change Dashboard: Multi-Century Observational Analytics & Predictive Scenario Modeling  
**Author:** Dev Solanki  
**Repository:** [https://github.com/divyasolankigla-pixel/Interactive-climate-change-dashboard](https://github.com/divyasolankigla-pixel/Interactive-climate-change-dashboard)  
**Live Application:** [https://divyasolankigla-pixel.github.io/Interactive-climate-change-dashboard/](https://divyasolankigla-pixel.github.io/Interactive-climate-change-dashboard/)  
**Technologies:** Python, Data Visualization, HTML5, CSS3, JavaScript, REST API, Canvas 2D, SVG  

---

## 1. Executive Summary

Global climate change represents one of the most pressing multi-decadal scientific and societal challenges. However, raw climate datasets spanning hundreds of years and millions of station readings remain inaccessible to non-specialists due to size, complexity, and disparate reporting formats.

The **Interactive Climate Change Dashboard** bridges this divide by delivering an end-to-end, data-driven web application that transforms multi-century observational records (1750–2024) into interactive, intuitive visual insights. The platform synthesizes surface temperature anomalies, atmospheric carbon dioxide concentrations, fossil fuel emissions by source, greenhouse gas potency breakdowns, sea level rise, Arctic sea ice contraction, and predictive policy scenario modeling aligned with the Intergovernmental Panel on Climate Change (IPCC) Sixth Assessment Report (AR6).

---

## 2. Scientific Data Sources & Methodology

### 2.1 Primary Observational Datasets
1. **Berkeley Earth Surface Temperature (BEST):**
   - Over 1.6 billion temperature readings from 39,000 global weather stations.
   - Monthly land surface temperatures with rigorous statistical homogenization to eliminate urban heat island effects and instrument change biases.
2. **NOAA Global Monitoring Laboratory (Mauna Loa Observatory):**
   - The Keeling Curve: Continuous high-precision measurement of atmospheric $\text{CO}_2$ (ppm) from 1958 to present.
3. **Law Dome Ice Core Records (Etheridge et al.):**
   - Firn air and antarctic ice core bubbles providing historical pre-industrial $\text{CO}_2$ concentration benchmarks (1750–1958).
4. **Global Carbon Project (Friedlingstein et al. 2024):**
   - Annual territorial emissions categorized by fuel type: Coal, Oil, Natural Gas, Cement production, and Gas Flaring.
5. **CSIRO & NASA Satellite Altimetry (Topex/Poseidon, Jason-1/2/3, Sentinel-6):**
   - Global Mean Sea Level (GMSL) time-series from 1880 to 2024 combining coastal tide gauge networks and dual-frequency radar altimetry.
6. **National Snow and Ice Data Center (NSIDC):**
   - Passive microwave satellite sensors tracking Arctic sea ice extent minimums (September average).

---

## 3. Data Processing & Statistical Formulations

### 3.1 Climatological Baselines & Anomalies
Temperature anomalies ($\Delta T$) are calculated against two international standards:
1. **IPCC Pre-Industrial Baseline (1850–1900):** $T_{\text{pre-ind}} = 8.14^\circ\text{C}$ (Land), $14.97^\circ\text{C}$ (Combined Land+Ocean).
2. **NASA GISS Mid-Century Baseline (1951–1980):** $T_{\text{GISS}} = 8.66^\circ\text{C}$ (Land), $15.30^\circ\text{C}$ (Combined).

$$\text{Anomaly}_y = \bar{T}_y - \bar{T}_{\text{baseline}}$$

### 3.2 Smoothing & Rolling Averages
To filter high-frequency interannual variability (such as El Niño–Southern Oscillation, ENSO) without phase lag:
$$\text{MA}_{5}(y) = \frac{1}{5} \sum_{i=-2}^{2} \text{Anomaly}_{y+i}$$

### 3.3 Pearson Correlation & Coupling
The statistical coupling between atmospheric $\text{CO}_2$ and global surface temperature is formulated via the Pearson product-moment correlation coefficient ($r$):
$$r = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n}(x_i - \bar{x})^2} \sqrt{\sum_{i=1}^{n}(y_i - \bar{y})^2}}$$

**Empirical Result:** $r = 0.870$ with a coefficient of determination $R^2 = 0.733$ ($p < 0.0001$), demonstrating that atmospheric $\text{CO}_2$ growth is the predominant physical driver explaining $>73\%$ of temperature anomaly variance.

### 3.4 Transient Climate Response to Cumulative Carbon Emissions (TCRE)
The IPCC AR6 confirms that global surface temperature increases are nearly linearly proportional to cumulative anthropogenic $\text{CO}_2$ emissions:
$$\Delta T(t) = \Delta T_0 + \left(\frac{\sum E_{\text{CO}_2}(t)}{1000}\right) \times \text{TCRE}$$
Where $\text{TCRE} \approx 0.45^\circ\text{C}$ per $1,000 \text{ Gt CO}_2$ (central estimate).

---

## 4. Key Scientific Findings

1. **Warming Acceleration:**
   - Pre-Industrial (1850–1900): $+0.029^\circ\text{C}$ / decade
   - Early 20th Century (1900–1950): $+0.068^\circ\text{C}$ / decade
   - Anthropogenic Acceleration (1980–2024): $+0.248^\circ\text{C}$ / decade
   - **Acceleration Factor:** Modern rate is **6.5x faster** than early industrial rates.

2. **Land vs. Ocean Differential:**
   - Land surfaces have already warmed by **$+2.04^\circ\text{C}$** above pre-industrial levels, exceeding the combined planetary average ($+1.31^\circ\text{C}$) due to lower specific heat capacity and lack of evaporative buffer.

3. **Polar Amplification:**
   - High-latitude monitoring stations ($>50^\circ\text{N/S}$, such as in Russia, Canada, and Scandinavia) exhibit warming deltas of $+1.8^\circ\text{C}$ to $+2.5^\circ\text{C}$, driven by sea-ice and snow albedo positive feedback loops.

---

## 5. Software Architecture & Implementation

### 5.1 Architecture Diagram

```
+--------------------------------------------------------------------------+
|                        Client Web Browser                                |
|  - HTML5 UI & Modern CSS3 Theme (Glassmorphic Dark Mode)                 |
|  - Native Canvas & SVG Charting Engine (HiDPI, Tooltips, Zero CDN)       |
|  - Equirectangular Climate Station World Map                             |
|  - Real-Time IPCC Scenario Simulator & Paris 1.5°C Carbon Budget Clock   |
+--------------------------------------------------------------------------+
                                    ▲
                                    │ HTTP / JSON API
                                    ▼
+--------------------------------------------------------------------------+
|                  Python Backend (app.py)                                 |
|  - Built-in HTTPServer (Zero External Dependencies)                      |
|  - High-Performance REST API Router (/api/global-trends, /api/cities)    |
|  - In-Memory Data Caching for sub-5ms API responses                      |
+--------------------------------------------------------------------------+
                                    ▲
                                    │
                                    ▼
+--------------------------------------------------------------------------+
|                  Preprocessed Data Layer (static/data/)                  |
|  - global_climate.json (275 years)  - cities_summary.json (100 cities)   |
|  - countries_summary.json (240 ctr) - emissions_ghg.json                 |
|  - environmental_indicators.json    - eda_metrics.json                   |
+--------------------------------------------------------------------------+
```

### 5.2 Zero-Dependency Architecture
The application runs out of the box on Python 3.8+ using pure standard library modules (`http.server`, `urllib`, `json`, `csv`, `math`). This guarantees portability across Windows, Linux, and macOS without requiring package installation or compiler toolchains.

---

## 6. How to Run & Verify

1. **Local Server:**
   ```powershell
   python app.py --port 8000
   ```
   Open `http://127.0.0.1:8000/` in any browser.

2. **One-Click Windows Launcher:**
   Double-click `run_dashboard.bat`.

3. **Jupyter Notebook Analysis:**
   Open `climate_eda_and_modeling.ipynb` in VS Code or JupyterLab to interact with data tables and statistical tests.

4. **Live GitHub Pages URL:**
   [https://divyasolankigla-pixel.github.io/Interactive-climate-change-dashboard/](https://divyasolankigla-pixel.github.io/Interactive-climate-change-dashboard/)
