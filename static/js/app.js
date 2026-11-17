/**
 * Interactive Climate Change Dashboard - Main Application Controller
 * Handles data orchestration, UI state, tabs, event bindings, and live clocks.
 */

window.ClimateApp = (function() {
  // Application Data Cache
  let globalClimate = null;
  let emissionsData = null;
  let indicatorsData = null;
  let countriesData = [] ;
  let citiesData = [];
  let edaMetrics = null;

  // Selected Countries for comparison
  let selectedCountries = ['United States', 'China', 'India', 'Germany'];

  // Carbon Budget Clock Interval
  let clockInterval = null;

  // Fetch helper with fallback to static JSON if API fails
  async function fetchWithFallback(apiPath, staticPath) {
    try {
      const res = await fetch(apiPath);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`API ${apiPath} failed, attempting static fallback ${staticPath}...`);
    }
    const resStatic = await fetch(staticPath);
    return await resStatic.json();
  }

  // Live Carbon Budget Clock
  function startCarbonClock() {
    if (!indicatorsData || !indicatorsData.carbon_budget) return;
    const budget = indicatorsData.carbon_budget;
    
    // As of mid-2024: 250 Gt CO2 remaining
    // Rate: 1,238 tonnes of CO2 per second
    const baseTime = new Date('2024-06-01T00:00:00Z').getTime();
    const tonnesPerSecond = budget.per_second_emission_tonnes || 1238;
    const initialTonnes = (budget.target_1_5c.budget_remaining_gt || 250) * 1e9;

    function tick() {
      const now = Date.now();
      const elapsedSeconds = (now - baseTime) / 1000;
      const consumedTonnes = elapsedSeconds * tonnesPerSecond;
      const remainingTonnes = Math.max(0, initialTonnes - consumedTonnes);

      const clockEl = document.getElementById('carbonClockCounter');
      if (clockEl) {
        clockEl.innerText = Math.round(remainingTonnes).toLocaleString() + ' Tonnes';
      }

      // Calculate years, days, hours, seconds remaining
      const secondsLeft = remainingTonnes / tonnesPerSecond;
      const years = Math.floor(secondsLeft / (365.25 * 86400));
      const days = Math.floor((secondsLeft % (365.25 * 86400)) / 86400);
      const hours = Math.floor((secondsLeft % 86400) / 3600);
      const mins = Math.floor((secondsLeft % 3600) / 60);
      const secs = Math.floor(secondsLeft % 60);

      const timeSpanEl = document.getElementById('carbonTimeLeft');
      if (timeSpanEl) {
        timeSpanEl.innerText = `${years}y ${days}d ${hours}h ${mins}m ${secs}s`;
      }
    }

    tick();
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(tick, 1000);
  }

  // Populate Key Metric Banners
  function updateKPIs() {
    if (!globalClimate || !emissionsData || !indicatorsData) return;

    const series = globalClimate.yearly_series;
    const latestTemp = series[series.length - 1];
    const latestEmiss = emissionsData.emissions_timeline[emissionsData.emissions_timeline.length - 1];
    const latestSea = indicatorsData.sea_level_timeline[indicatorsData.sea_level_timeline.length - 1];
    const latestIce = indicatorsData.arctic_ice_timeline[indicatorsData.arctic_ice_timeline.length - 1];

    const tempEl = document.getElementById('kpiGlobalTemp');
    const tempAnomEl = document.getElementById('kpiTempAnomaly');
    const co2El = document.getElementById('kpiAtmosphericCO2');
    const emissEl = document.getElementById('kpiAnnualEmissions');
    const seaEl = document.getElementById('kpiSeaLevel');
    const iceEl = document.getElementById('kpiArcticIce');

    if (tempEl) tempEl.innerText = `+${latestTemp.anomaly_preind_land.toFixed(2)}°C`;
    if (tempAnomEl) tempAnomEl.innerText = `Ocean+Land: +${latestTemp.anomaly_preind_ocean ? latestTemp.anomaly_preind_ocean.toFixed(2) : '1.31'}°C`;
    if (co2El) co2El.innerText = `${latestEmiss.co2_ppm} ppm`;
    if (emissEl) emissEl.innerText = `${latestEmiss.total} Gt`;
    if (seaEl) seaEl.innerText = `+${latestSea.sea_level_mm.toFixed(0)} mm`;
    if (iceEl) iceEl.innerText = `${latestIce.extent_m_km2} M km²`;
  }

  // Render Overview Charts
  function renderOverviewTab(filterRange = 'all') {
    if (!globalClimate) return;
    let series = globalClimate.yearly_series;

    if (filterRange === '1900') {
      series = series.filter(x => x.year >= 1900);
    } else if (filterRange === '1950') {
      series = series.filter(x => x.year >= 1950);
    } else if (filterRange === '1980') {
      series = series.filter(x => x.year >= 1980);
    }

    const labels = series.map(s => s.year.toString());

    // Main Global Temperature Anomaly Timeline
    ClimateCharts.renderLineChart('globalTempChartCanvas', {
      labels: labels,
      series: [
        {
          name: 'Annual Land Temperature Anomaly',
          data: series.map(s => s.anomaly_preind_land),
          color: '#ef4444',
          fill: true,
          fillColor: 'rgba(239, 68, 68, 0.12)',
          lineWidth: 2
        },
        {
          name: '5-Year Moving Average',
          data: series.map(s => s.anomaly_5yr_ma),
          color: '#f59e0b',
          lineWidth: 2.5
        },
        {
          name: 'Land & Ocean Combined Anomaly',
          data: series.map(s => s.anomaly_preind_ocean),
          color: '#38bdf8',
          lineWidth: 2
        }
      ],
      yUnit: '°C'
    });

    // Warming Stripes Barcode
    ClimateCharts.renderWarmingStripes('warmingStripesContainer', globalClimate.stripes);

    // Monthly Climatology Comparison (Seasonal Shift)
    const monthly = globalClimate.monthly_climatology;
    ClimateCharts.renderLineChart('monthlyClimatologyCanvas', {
      labels: monthly.map(m => m.month),
      series: [
        {
          name: 'Recent Decade (2000-2015)',
          data: monthly.map(m => m.recent_temp),
          color: '#ef4444',
          lineWidth: 2.5
        },
        {
          name: 'Mid-Century Baseline (1951-1980)',
          data: monthly.map(m => m.baseline_temp),
          color: '#38bdf8',
          lineWidth: 2,
          dash: [4, 4]
        }
      ],
      yUnit: '°C'
    });
  }

  // Render Emissions Tab
  function renderEmissionsTab() {
    if (!emissionsData) return;

    // 1. Stacked Emissions Timeline by Source
    const timeline = emissionsData.emissions_timeline.filter(e => e.year >= 1900);
    ClimateCharts.renderStackedAreaChart('emissionsStackedCanvas', {
      labels: timeline.map(t => t.year.toString()),
      series: [
        { name: 'Coal', data: timeline.map(t => t.coal), color: '#334155' },
        { name: 'Oil', data: timeline.map(t => t.oil), color: '#0284c7' },
        { name: 'Natural Gas', data: timeline.map(t => t.gas), color: '#38bdf8' },
        { name: 'Cement Production', data: timeline.map(t => t.cement), color: '#94a3b8' },
        { name: 'Gas Flaring', data: timeline.map(t => t.flaring), color: '#f59e0b' }
      ],
      yUnit: ' Gt'
    });

    // 2. Top Emitting Nations (Bar Chart)
    const countries = emissionsData.countries_emissions.slice(0, 10);
    ClimateCharts.renderBarChart('countryEmissionsCanvas', {
      horizontal: true,
      labels: countries.map(c => c.country),
      values: countries.map(c => c.annual_mt),
      unit: ' Mt',
      colors: countries.map((c, i) => i === 0 ? '#ef4444' : (i < 3 ? '#f97316' : '#38bdf8'))
    });

    // 3. Per Capita Emissions (Bar Chart)
    const sortedPerCapita = [...emissionsData.countries_emissions].sort((a, b) => b.per_capita_t - a.per_capita_t).slice(0, 10);
    ClimateCharts.renderBarChart('perCapitaCanvas', {
      horizontal: true,
      labels: sortedPerCapita.map(c => c.country),
      values: sortedPerCapita.map(c => c.per_capita_t),
      unit: ' t/cap',
      colors: sortedPerCapita.map(c => c.per_capita_t > 10 ? '#ef4444' : '#10b981')
    });

    // 4. GHG Breakdown by Gas & Sector (Donuts)
    const ghg = emissionsData.ghg_composition;
    ClimateCharts.renderDonutChart('ghgByGasCanvas', {
      centerText: 'By Gas',
      centerSub: 'IPCC AR6',
      items: ghg.by_gas.map((g, i) => ({
        label: g.formula,
        value: g.share_pct,
        color: ['#38bdf8', '#f59e0b', '#10b981', '#a855f7'][i]
      }))
    });

    ClimateCharts.renderDonutChart('ghgBySectorCanvas', {
      centerText: 'By Sector',
      centerSub: 'Global GHG',
      items: ghg.by_sector.map((s, i) => ({
        label: s.sector.split(' ')[0],
        value: s.share_pct,
        color: ['#ef4444', '#f97316', '#10b981', '#0ea5e9', '#8b5cf6'][i]
      }))
    });
  }

  // Country Comparison View
  function renderCountryComparison() {
    if (!countriesData.length) return;

    // Filter matching countries
    const targets = countriesData.filter(c => selectedCountries.includes(c.country));
    if (!targets.length) return;

    // Render Chip Tags
    const chipsBox = document.getElementById('countryChipsContainer');
    if (chipsBox) {
      chipsBox.innerHTML = '';
      selectedCountries.forEach(name => {
        const chip = document.createElement('span');
        chip.className = 'chip-tag';
        chip.innerHTML = `${name} <span class="chip-remove" data-country="${name}">✕</span>`;
        chipsBox.appendChild(chip);
      });

      // Attach remove handlers
      chipsBox.querySelectorAll('.chip-remove').forEach(btn => {
        btn.onclick = function() {
          const cName = this.getAttribute('data-country');
          selectedCountries = selectedCountries.filter(c => c !== cName);
          renderCountryComparison();
        };
      });
    }

    // Align yearly timelines (1880 to 2013)
    const years = [];
    for (let y = 1880; y <= 2013; y++) years.push(y);

    const colors = ['#ef4444', '#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
    const series = targets.map((c, i) => {
      const yearMap = {};
      c.timeline.forEach(pt => { yearMap[pt.year] = pt.anomaly; });
      return {
        name: c.country,
        data: years.map(y => yearMap[y] !== undefined ? yearMap[y] : null),
        color: colors[i % colors.length],
        lineWidth: 2
      };
    });

    ClimateCharts.renderLineChart('countryComparisonCanvas', {
      labels: years.map(String),
      series: series,
      yUnit: '°C'
    });

    // Populate Comparison Table
    const tbody = document.getElementById('countryTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      targets.forEach(c => {
        const tr = document.createElement('tr');
        const badgeColor = c.warming_delta > 1.4 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)';
        const textCol = c.warming_delta > 1.4 ? '#ef4444' : '#38bdf8';
        tr.innerHTML = `
          <td><strong>${c.country}</strong></td>
          <td>${c.baseline_temp}°C</td>
          <td>${c.recent_temp}°C</td>
          <td><span class="temp-tag" style="background:${badgeColor}; color:${textCol};">+${c.warming_delta}°C</span></td>
          <td>${c.start_year} - ${c.end_year}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Attribution & Correlation Tab
  function renderAttributionTab() {
    if (!edaMetrics || !edaMetrics.correlation_analysis) return;
    const corr = edaMetrics.correlation_analysis;

    // Atmospheric CO2 vs Temperature Scatter
    if (emissionsData && globalClimate) {
      const eMap = {};
      emissionsData.emissions_timeline.forEach(e => { eMap[e.year] = e.co2_ppm; });
      const pts = [];
      globalClimate.yearly_series.forEach(t => {
        if (eMap[t.year] && t.anomaly_preind_land !== null) {
          pts.push({
            x: eMap[t.year],
            y: t.anomaly_preind_land,
            year: t.year
          });
        }
      });

      ClimateCharts.renderScatterPlot('co2VsTempScatterCanvas', {
        points: pts,
        regression: {
          slope: corr.regression_co2_vs_temp.slope_c_per_ppm,
          intercept: corr.regression_co2_vs_temp.intercept,
          r2: corr.regression_co2_vs_temp.r_squared
        }
      });
    }

    // Correlation Matrix Table
    const tbody = document.getElementById('correlationTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      corr.pairs.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${p.var1}</strong></td>
          <td><strong>${p.var2}</strong></td>
          <td><span class="temp-tag" style="background:rgba(56, 189, 248, 0.15); color:#38bdf8; font-weight:bold;">r = ${p.correlation_r}</span></td>
          <td><strong>${p.r_squared}</strong></td>
          <td>${p.interpretation}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    startCarbonClock();
  }

  // EDA Hub Tab
  function renderEDATab() {
    if (!edaMetrics) return;

    // Epochs Table
    const epochTbody = document.getElementById('edaEpochTableBody');
    if (epochTbody) {
      epochTbody.innerHTML = '';
      edaMetrics.epoch_stats.forEach(ep => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${ep.epoch_name}</strong></td>
          <td>${ep.years}</td>
          <td>${ep.mean_land_temp}°C</td>
          <td>±${ep.std_dev}°C</td>
          <td><span style="color:${ep.mean_anomaly_vs_1850 >= 0 ? '#ef4444' : '#38bdf8'}">${(ep.mean_anomaly_vs_1850 >= 0 ? '+' : '') + ep.mean_anomaly_vs_1850}°C</span></td>
          <td>±${ep.mean_uncertainty}°C</td>
          <td>${ep.sample_size}</td>
        `;
        epochTbody.appendChild(tr);
      });
    }

    // Warming Rates Acceleration
    const rateTbody = document.getElementById('edaWarmingRateBody');
    if (rateTbody) {
      rateTbody.innerHTML = '';
      edaMetrics.warming_rates.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.period}</strong> (${r.years_span})</td>
          <td><strong style="color:${r.deg_c_per_decade >= 0.2 ? '#ef4444' : '#f59e0b'};">+${r.deg_c_per_decade}°C / decade</strong></td>
          <td>${r.total_warming_over_period}°C</td>
          <td><span class="kpi-badge ${r.acceleration_factor_vs_1850 >= 4 ? 'badge-danger' : 'badge-warning'}">${r.acceleration_factor_vs_1850}x speed</span></td>
        `;
        rateTbody.appendChild(tr);
      });
    }

    // Polar Amplification by Latitudinal Zone
    const polarTbody = document.getElementById('edaPolarBody');
    if (polarTbody) {
      polarTbody.innerHTML = '';
      edaMetrics.latitudinal_warming.forEach(z => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${z.zone}</strong></td>
          <td>${z.city_count} stations</td>
          <td><strong style="color:${z.mean_warming_delta >= 1.4 ? '#ef4444' : '#38bdf8'};">+${z.mean_warming_delta}°C</strong></td>
          <td>+${z.max_warming_delta}°C</td>
        `;
        polarTbody.appendChild(tr);
      });
    }

    // Uncertainty Timeline Chart
    const uncTimeline = edaMetrics.uncertainty_timeline;
    ClimateCharts.renderLineChart('edaUncertaintyCanvas', {
      labels: uncTimeline.map(u => u.year.toString()),
      series: [
        {
          name: 'Measurement Uncertainty (±°C)',
          data: uncTimeline.map(u => u.uncertainty_deg_c),
          color: '#38bdf8',
          fill: true,
          fillColor: 'rgba(56, 189, 248, 0.15)',
          lineWidth: 2
        }
      ],
      yUnit: '°C',
      yMin: 0
    });
  }

  // City Station Modal / Detailed View
  window.onCitySelected = function(city) {
    const modal = document.getElementById('cityDetailCard');
    if (!modal) return;
    modal.style.display = 'block';

    document.getElementById('modalCityName').innerText = `${city.city}, ${city.country}`;
    document.getElementById('modalCityCoords').innerText = `Latitude: ${city.lat_str} | Longitude: ${city.lon_str}`;
    document.getElementById('modalBaselineTemp').innerText = `${city.baseline_temp}°C`;
    document.getElementById('modalRecentTemp').innerText = `${city.recent_temp}°C`;
    document.getElementById('modalWarmingDelta').innerText = `+${city.warming_delta}°C`;

    // Render mini history chart
    const timeline = city.timeline || [];
    ClimateCharts.renderLineChart('cityHistoryCanvas', {
      labels: timeline.map(t => t.year.toString()),
      series: [
        {
          name: 'Annual Mean Temp',
          data: timeline.map(t => t.temp),
          color: '#ef4444',
          lineWidth: 2
        }
      ],
      yUnit: '°C'
    });
  };

  // Setup Event Handlers
  function bindEvents() {
    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        this.classList.add('active');
        const tabKey = this.getAttribute('data-tab');
        const target = document.getElementById(tabKey);
        if (target) {
          target.classList.add('active');
          window.dispatchEvent(new Event('resize'));
        }

        // Trigger on-demand renders
        if (tabKey === 'overviewTab') renderOverviewTab();
        else if (tabKey === 'emissionsTab') renderEmissionsTab();
        else if (tabKey === 'comparisonTab') renderCountryComparison();
        else if (tabKey === 'attributionTab') renderAttributionTab();
        else if (tabKey === 'simulatorTab') ClimateSimulator.updateSimulation();
        else if (tabKey === 'edaTab') renderEDATab();
      };
    });

    // Overview Time Filters (All, 1900, 1950, 1980)
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderOverviewTab(this.getAttribute('data-range'));
      };
    });

    // Country Search & Dropdown Add
    const countrySelect = document.getElementById('countryDropdownSelect');
    if (countrySelect) {
      countrySelect.onchange = function() {
        const val = this.value;
        if (val && !selectedCountries.includes(val)) {
          if (selectedCountries.length >= 6) selectedCountries.shift();
          selectedCountries.push(val);
          renderCountryComparison();
        }
        this.value = '';
      };
    }

    // Country Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = function() {
        const preset = this.getAttribute('data-preset');
        if (preset === 'emitters') selectedCountries = ['China', 'United States', 'India', 'Russia'];
        else if (preset === 'fastest') selectedCountries = ['Russia', 'Canada', 'Mongolia', 'Finland'];
        else if (preset === 'islands') selectedCountries = ['Indonesia', 'Philippines', 'Japan', 'United Kingdom'];
        else if (preset === 'continents') selectedCountries = ['Brazil', 'Egypt', 'Australia', 'Germany'];
        renderCountryComparison();
      };
    });

    // Map Zone Filters
    document.querySelectorAll('.map-filter-btn').forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        ClimateMap.filterByZone(this.getAttribute('data-zone'));
      };
    });

    // Simulator Sliders
    const peakSlider = document.getElementById('simPeakYear');
    const rateSlider = document.getElementById('simReductionRate');
    const sensSelect = document.getElementById('simSensitivity');

    if (peakSlider) {
      peakSlider.oninput = function() {
        document.getElementById('simPeakYearVal').innerText = this.value;
        ClimateSimulator.updateSimulation();
      };
    }
    if (rateSlider) {
      rateSlider.oninput = function() {
        document.getElementById('simReductionRateVal').innerText = this.value + '%/yr';
        ClimateSimulator.updateSimulation();
      };
    }
    if (sensSelect) {
      sensSelect.onchange = function() {
        ClimateSimulator.updateSimulation();
      };
    }

    // Simulator Presets
    document.querySelectorAll('.sim-preset-btn').forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll('.sim-preset-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        ClimateSimulator.setPreset(this.getAttribute('data-scenario'));
      };
    });

    // Close Modal Button
    const closeBtn = document.getElementById('closeCityModalBtn');
    if (closeBtn) {
      closeBtn.onclick = function() {
        document.getElementById('cityDetailCard').style.display = 'none';
      };
    }
  }

  // Populate Country Selector Dropdown
  function populateCountryDropdown() {
    const sel = document.getElementById('countryDropdownSelect');
    if (!sel || !countriesData.length) return;
    sel.innerHTML = '<option value="">+ Add a country to compare...</option>';
    const sorted = [...countriesData].sort((a, b) => a.country.localeCompare(b.country));
    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.country;
      opt.innerText = `${c.country} (+${c.warming_delta}°C)`;
      sel.appendChild(opt);
    });
  }

  return {
    init: async function() {
      console.log("Initializing Interactive Climate Change Dashboard...");
      try {
        // Parallel data loading
        const [gc, em, ind, countries, cities, eda] = await Promise.all([
          fetchWithFallback('/api/global-trends', 'static/data/global_climate.json'),
          fetchWithFallback('/api/emissions', 'static/data/emissions_ghg.json'),
          fetchWithFallback('/api/indicators', 'static/data/environmental_indicators.json'),
          fetchWithFallback('/api/countries', 'static/data/countries_summary.json'),
          fetchWithFallback('/api/cities', 'static/data/cities_summary.json'),
          fetchWithFallback('/api/eda', 'static/data/eda_metrics.json')
        ]);

        globalClimate = gc;
        emissionsData = em;
        indicatorsData = ind;
        countriesData = countries || [];
        citiesData = cities || [];
        edaMetrics = eda;

        updateKPIs();
        bindEvents();
        populateCountryDropdown();

        // Initialize sub-modules
        ClimateMap.init('climateMapCanvas', citiesData);
        ClimateSimulator.init(indicatorsData);

        // Render initial view
        renderOverviewTab();

        console.log("Interactive Climate Dashboard loaded successfully!");
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      }
    }
  };
})();

// Auto-launch on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ClimateApp.init();
});
