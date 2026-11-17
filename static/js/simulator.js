/**
 * Interactive Climate Change Dashboard - IPCC Climate Scenario Simulator
 * Dynamic model for simulating future emissions, temperature anomalies, and sea level rise.
 */

window.ClimateSimulator = (function() {
  let simCanvasId = 'simChartCanvas';
  let emissionsCanvasId = 'simEmissionsCanvas';
  let ipccData = null;

  // Transient Climate Response to Cumulative Carbon Emissions (TCRE):
  // standard IPCC AR6: ~0.45°C per 1,000 Gt CO2 emitted (range 0.27 to 0.63)
  function runSimulation(peakYear, reductionRatePct, sensitivityFactor) {
    const startYear = 2024;
    const currentEmissions = 39.0; // Gt CO2 / year
    const currentAnomaly = 1.28;   // °C
    const currentSeaLevel = 26.2;  // cm

    const trajectory = [];
    let cumCO2 = 0.0;
    let emiss = currentEmissions;
    let seaLevel = currentSeaLevel;

    // TCRE adjusted for sensitivity (1.0 = standard 3.0°C sensitivity)
    const tcre = 0.45 * (sensitivityFactor || 1.0);

    for (let y = startYear; y <= 2100; y++) {
      if (y <= peakYear) {
        // Growth before peak (+0.8%/yr)
        emiss *= 1.008;
      } else {
        // Annual decay after peak
        const decay = 1.0 - (reductionRatePct / 100.0);
        emiss = Math.max(0.0, emiss * decay);
      }

      cumCO2 += emiss;
      const deltaTemp = (cumCO2 / 1000.0) * tcre;
      const tempAnomaly = currentAnomaly + deltaTemp;

      // Sea level response: ongoing baseline (~0.38 cm/yr) + thermal expansion & ice loss
      seaLevel += 0.38 + (deltaTemp * 0.18);

      if (y % 5 === 0 || y === 2100 || y === startYear) {
        trajectory.push({
          year: y,
          emissions: round(emiss, 2),
          cumCO2: round(cumCO2, 1),
          tempAnomaly: round(tempAnomaly, 2),
          seaLevel: round(seaLevel, 1)
        });
      }
    }

    return trajectory;
  }

  function round(val, dec) {
    const factor = Math.pow(10, dec);
    return Math.round(val * factor) / factor;
  }

  return {
    init: function(envIndicators) {
      ipccData = envIndicators ? envIndicators.ipcc_scenarios : null;
      this.updateSimulation();
    },

    setPreset: function(scenarioKey) {
      if (!ipccData || !ipccData[scenarioKey]) return;
      const sc = ipccData[scenarioKey];

      let peakYear = 2030;
      let rate = 3.0;

      if (scenarioKey === 'SSP1-1.9') {
        peakYear = 2025;
        rate = 7.5;
      } else if (scenarioKey === 'SSP1-2.6') {
        peakYear = 2028;
        rate = 4.2;
      } else if (scenarioKey === 'SSP2-4.5') {
        peakYear = 2038;
        rate = 1.8;
      } else if (scenarioKey === 'SSP3-7.0') {
        peakYear = 2060;
        rate = 0.3;
      } else if (scenarioKey === 'SSP5-8.5') {
        peakYear = 2080;
        rate = 0.0;
      }

      // Update UI sliders
      const peakEl = document.getElementById('simPeakYear');
      const rateEl = document.getElementById('simReductionRate');
      if (peakEl) { peakEl.value = peakYear; document.getElementById('simPeakYearVal').innerText = peakYear; }
      if (rateEl) { rateEl.value = rate; document.getElementById('simReductionRateVal').innerText = rate + '%/yr'; }

      this.updateSimulation();
    },

    updateSimulation: function() {
      const peakYear = parseInt(document.getElementById('simPeakYear')?.value || 2030);
      const reductionRate = parseFloat(document.getElementById('simReductionRate')?.value || 3.5);
      const sensVal = parseFloat(document.getElementById('simSensitivity')?.value || 1.0);

      const traj = runSimulation(peakYear, reductionRate, sensVal);
      const finalPoint = traj[traj.length - 1];

      // Update KPI Badges
      const tempValEl = document.getElementById('simWarming2100');
      const seaValEl = document.getElementById('simSeaLevel2100');
      const parisBadgeEl = document.getElementById('simParisBadge');
      const cumCO2El = document.getElementById('simCumCO2');

      if (tempValEl) tempValEl.innerText = `+${finalPoint.tempAnomaly.toFixed(2)}°C`;
      if (seaValEl) seaValEl.innerText = `+${finalPoint.seaLevel.toFixed(1)} cm`;
      if (cumCO2El) cumCO2El.innerText = `${finalPoint.cumCO2} Gt`;

      if (parisBadgeEl) {
        if (finalPoint.tempAnomaly <= 1.55) {
          parisBadgeEl.className = 'kpi-badge badge-success';
          parisBadgeEl.innerText = '✓ Paris 1.5°C Achieved';
        } else if (finalPoint.tempAnomaly <= 2.0) {
          parisBadgeEl.className = 'kpi-badge badge-warning';
          parisBadgeEl.innerText = '⚠ 2.0°C Limit Respected';
        } else {
          parisBadgeEl.className = 'kpi-badge badge-danger';
          parisBadgeEl.innerText = '✗ Dangerous Warming (>2.0°C)';
        }
      }

      // Render Temperature Trajectory Chart
      const labels = traj.map(t => t.year.toString());
      const tempSeries = [
        {
          name: 'Your Custom Scenario',
          data: traj.map(t => t.tempAnomaly),
          color: finalPoint.tempAnomaly <= 1.6 ? '#10b981' : (finalPoint.tempAnomaly <= 2.2 ? '#f59e0b' : '#ef4444'),
          fill: true,
          fillColor: finalPoint.tempAnomaly <= 1.6 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          lineWidth: 3
        }
      ];

      // Add reference benchmarks: 1.5°C and 2.0°C targets
      tempSeries.push({
        name: 'Paris 1.5°C Target',
        data: traj.map(() => 1.5),
        color: '#10b981',
        dash: [4, 4],
        lineWidth: 1.5
      });
      tempSeries.push({
        name: '2.0°C Upper Guardrail',
        data: traj.map(() => 2.0),
        color: '#f59e0b',
        dash: [4, 4],
        lineWidth: 1.5
      });

      ClimateCharts.renderLineChart(simCanvasId, {
        labels: labels,
        series: tempSeries,
        yUnit: '°C',
        yMin: 1.0,
        yMax: Math.max(3.5, finalPoint.tempAnomaly + 0.3)
      });

      // Render Emissions Trajectory Chart
      ClimateCharts.renderLineChart(emissionsCanvasId, {
        labels: labels,
        series: [
          {
            name: 'Annual Global CO₂ Emissions (Gt)',
            data: traj.map(t => t.emissions),
            color: '#38bdf8',
            fill: true,
            fillColor: 'rgba(56, 189, 248, 0.15)',
            lineWidth: 2.5
          }
        ],
        yUnit: ' Gt',
        yMin: 0
      });
    }
  };
})();
