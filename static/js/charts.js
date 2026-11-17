/**
 * Interactive Climate Change Dashboard - Native Canvas & SVG Charting Engine
 * High-performance, zero-dependency, works 100% offline and online.
 */

window.ClimateCharts = (function() {

  // Global Tooltip Singleton
  let tooltipEl = null;

  function getTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'custom-tooltip';
      tooltipEl.style.display = 'none';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(x, y, html) {
    const tip = getTooltip();
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = `${Math.min(window.innerWidth - tip.offsetWidth - 15, x + 12)}px`;
    tip.style.top = `${y + 12}px`;
  }

  function hideTooltip() {
    const tip = getTooltip();
    tip.style.display = 'none';
  }

  // Setup HiDPI Canvas
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.parentElement.clientWidth || 600;
    const h = rect.height || canvas.parentElement.clientHeight || 300;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: w, height: h };
  }

  return {
    /**
     * Line / Multi-Series Area Chart
     */
    renderLineChart: function(canvasId, config) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const { ctx, width, height } = setupCanvas(canvas);
      const padding = { top: 30, right: 35, bottom: 45, left: 60 };
      const plotW = width - padding.left - padding.right;
      const plotH = height - padding.top - padding.bottom;

      const labels = config.labels || [];
      const seriesList = config.series || []; // [{ name, data, color, fill, baseline, isBar }]
      
      if (!labels.length || !seriesList.length) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return;
      }

      // Compute Y Min and Max
      let yMin = config.yMin !== undefined ? config.yMin : Infinity;
      let yMax = config.yMax !== undefined ? config.yMax : -Infinity;

      seriesList.forEach(s => {
        s.data.forEach(v => {
          if (v !== null && v !== undefined && !isNaN(v)) {
            if (v < yMin) yMin = v;
            if (v > yMax) yMax = v;
          }
        });
      });

      if (yMin === Infinity) { yMin = 0; yMax = 1; }
      if (yMin === yMax) { yMin -= 1; yMax += 1; }
      
      // Add padding to Y bounds
      const ySpan = yMax - yMin;
      yMin = config.yMin !== undefined ? config.yMin : yMin - ySpan * 0.08;
      yMax = config.yMax !== undefined ? config.yMax : yMax + ySpan * 0.08;

      const getX = idx => padding.left + (idx / (labels.length - 1)) * plotW;
      const getY = val => padding.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

      // Draw Grid & Y Ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const numYTicks = 5;
      for (let i = 0; i <= numYTicks; i++) {
        const val = yMin + (i / numYTicks) * (yMax - yMin);
        const y = getY(val);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        let formatted = Math.abs(val) < 10 ? val.toFixed(1) : Math.round(val);
        if (config.yUnit) formatted += config.yUnit;
        ctx.fillText(formatted, padding.left - 10, y);
      }

      // Draw Baseline (y = 0 if within range)
      if (yMin <= 0 && yMax >= 0) {
        const y0 = getY(0);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y0);
        ctx.lineTo(width - padding.right, y0);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw X Ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const step = Math.ceil(labels.length / 8);
      for (let i = 0; i < labels.length; i += step) {
        const x = getX(i);
        ctx.fillText(labels[i], x, height - padding.bottom + 10);
      }
      // Ensure last label is drawn
      const lastX = getX(labels.length - 1);
      ctx.fillText(labels[labels.length - 1], lastX, height - padding.bottom + 10);

      // Render Series
      seriesList.forEach(s => {
        // Shaded area fill if requested
        if (s.fill) {
          ctx.beginPath();
          let started = false;
          let firstX = 0, lastValidX = 0;
          for (let i = 0; i < s.data.length; i++) {
            const val = s.data[i];
            if (val === null || val === undefined) continue;
            const x = getX(i);
            const y = getY(val);
            if (!started) {
              ctx.moveTo(x, getY(Math.max(0, yMin)));
              ctx.lineTo(x, y);
              firstX = x;
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
            lastValidX = x;
          }
          if (started) {
            ctx.lineTo(lastValidX, getY(Math.max(0, yMin)));
            ctx.closePath();
            ctx.fillStyle = s.fillColor || 'rgba(56, 189, 248, 0.12)';
            ctx.fill();
          }
        }

        // Draw Line
        ctx.strokeStyle = s.color || '#38bdf8';
        ctx.lineWidth = s.lineWidth || 2;
        if (s.dash) ctx.setLineDash(s.dash);
        else ctx.setLineDash([]);

        ctx.beginPath();
        let active = false;
        for (let i = 0; i < s.data.length; i++) {
          const val = s.data[i];
          if (val === null || val === undefined || isNaN(val)) {
            active = false;
            continue;
          }
          const x = getX(i);
          const y = getY(val);
          if (!active) {
            ctx.moveTo(x, y);
            active = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Interactive Mouse Move Crosshair & Tooltip
      canvas.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (mx < padding.left || mx > width - padding.right || my < padding.top || my > height - padding.bottom) {
          hideTooltip();
          return;
        }

        const frac = (mx - padding.left) / plotW;
        const idx = Math.min(labels.length - 1, Math.max(0, Math.round(frac * (labels.length - 1))));
        const label = labels[idx];

        let tipHtml = `<strong style="color: #38bdf8; font-size: 0.9rem;">${label}</strong><div style="margin-top: 4px;">`;
        seriesList.forEach(s => {
          const val = s.data[idx];
          if (val !== null && val !== undefined) {
            tipHtml += `<div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:2px;">
              <span style="color:${s.color}; font-weight:500;">● ${s.name}:</span>
              <strong style="color:#f8fafc">${val}${config.yUnit || ''}</strong>
            </div>`;
          }
        });
        tipHtml += '</div>';

        showTooltip(e.clientX, e.clientY, tipHtml);
      };

      canvas.onmouseleave = function() {
        hideTooltip();
      };
    },

    /**
     * Stacked Area Chart (Emissions by source)
     */
    renderStackedAreaChart: function(canvasId, config) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const { ctx, width, height } = setupCanvas(canvas);
      const padding = { top: 30, right: 35, bottom: 45, left: 60 };
      const plotW = width - padding.left - padding.right;
      const plotH = height - padding.top - padding.bottom;

      const labels = config.labels || [];
      const series = config.series || []; // [{ name, data: [], color }]
      if (!labels.length || !series.length) return;

      // Compute stacked totals
      const stacked = [];
      let maxStack = 0;
      for (let i = 0; i < labels.length; i++) {
        let acc = 0;
        const row = [0];
        series.forEach(s => {
          acc += (s.data[i] || 0);
          row.push(acc);
        });
        stacked.push(row);
        if (acc > maxStack) maxStack = acc;
      }
      maxStack = Math.ceil(maxStack * 1.05);

      const getX = idx => padding.left + (idx / (labels.length - 1)) * plotW;
      const getY = val => padding.top + plotH - (val / maxStack) * plotH;

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';

      for (let i = 0; i <= 5; i++) {
        const val = Math.round((i / 5) * maxStack);
        const y = getY(val);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(val + (config.yUnit || ' Gt'), padding.left - 10, y + 4);
      }

      // X Ticks
      ctx.textAlign = 'center';
      const step = Math.ceil(labels.length / 8);
      for (let i = 0; i < labels.length; i += step) {
        ctx.fillText(labels[i], getX(i), height - padding.bottom + 14);
      }

      // Draw Stacked Layers (from back to front)
      for (let sIdx = series.length - 1; sIdx >= 0; sIdx--) {
        const s = series[sIdx];
        ctx.fillStyle = s.color;
        ctx.beginPath();

        // Top line
        for (let i = 0; i < labels.length; i++) {
          const x = getX(i);
          const y = getY(stacked[i][sIdx + 1]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Bottom line in reverse
        for (let i = labels.length - 1; i >= 0; i--) {
          const x = getX(i);
          const y = getY(stacked[i][sIdx]);
          ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
      }

      // Hover
      canvas.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        if (mx < padding.left || mx > width - padding.right) {
          hideTooltip();
          return;
        }

        const frac = (mx - padding.left) / plotW;
        const idx = Math.min(labels.length - 1, Math.max(0, Math.round(frac * (labels.length - 1))));
        const label = labels[idx];
        const total = stacked[idx][series.length];

        let tipHtml = `<strong style="color: #38bdf8">${label} Total: ${total.toFixed(2)} Gt CO₂</strong><div style="margin-top: 4px;">`;
        series.forEach((s, sIdx) => {
          const val = s.data[idx] || 0;
          const pct = ((val / total) * 100).toFixed(1);
          tipHtml += `<div style="display:flex; justify-content:space-between; gap:12px;">
            <span style="color:${s.color}">● ${s.name}:</span>
            <strong>${val.toFixed(2)} Gt (${pct}%)</strong>
          </div>`;
        });
        tipHtml += '</div>';
        showTooltip(e.clientX, e.clientY, tipHtml);
      };
      canvas.onmouseleave = hideTooltip;
    },

    /**
     * Bar Chart (Horizontal or Vertical)
     */
    renderBarChart: function(canvasId, config) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const { ctx, width, height } = setupCanvas(canvas);
      const isHorizontal = config.horizontal || false;
      const labels = config.labels || [];
      const values = config.values || [];
      const colors = config.colors || [];

      if (!labels.length) return;

      if (isHorizontal) {
        const padding = { top: 20, right: 40, bottom: 30, left: 110 };
        const plotW = width - padding.left - padding.right;
        const plotH = height - padding.top - padding.bottom;
        const maxVal = Math.max(...values) * 1.15 || 10;
        const barH = Math.min(24, Math.floor(plotH / labels.length) - 6);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        labels.forEach((label, i) => {
          const val = values[i];
          const y = padding.top + (i + 0.5) * (plotH / labels.length);
          const w = (val / maxVal) * plotW;
          
          ctx.fillText(label, padding.left - 10, y);

          // Bar
          ctx.fillStyle = colors[i] || '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(padding.left, y - barH / 2, Math.max(2, w), barH, [0, 4, 4, 0]);
          ctx.fill();

          // Value label
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'left';
          ctx.fillText(val + (config.unit || ''), padding.left + w + 6, y);
          ctx.textAlign = 'right';
        });

      } else {
        const padding = { top: 20, right: 25, bottom: 40, left: 50 };
        const plotW = width - padding.left - padding.right;
        const plotH = height - padding.top - padding.bottom;
        const maxVal = Math.max(...values) * 1.15 || 10;
        const barW = Math.min(36, Math.floor(plotW / labels.length) - 8);

        values.forEach((val, i) => {
          const x = padding.left + (i + 0.5) * (plotW / labels.length);
          const h = (val / maxVal) * plotH;
          const y = padding.top + plotH - h;

          ctx.fillStyle = colors[i] || '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(x - barW / 2, y, barW, h, [4, 4, 0, 0]);
          ctx.fill();

          // Label
          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], x, height - padding.bottom + 14);
        });
      }
    },

    /**
     * Scatter Plot with Linear Regression (CO2 vs Temp)
     */
    renderScatterPlot: function(canvasId, config) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const { ctx, width, height } = setupCanvas(canvas);
      const padding = { top: 30, right: 35, bottom: 45, left: 60 };
      const plotW = width - padding.left - padding.right;
      const plotH = height - padding.top - padding.bottom;

      const points = config.points || []; // [{ x: co2_ppm, y: temp_anomaly, year }]
      if (!points.length) return;

      const xMin = config.xMin || 270;
      const xMax = config.xMax || 430;
      const yMin = config.yMin !== undefined ? config.yMin : -0.6;
      const yMax = config.yMax !== undefined ? config.yMax : 2.2;

      const getX = xVal => padding.left + ((xVal - xMin) / (xMax - xMin)) * plotW;
      const getY = yVal => padding.top + plotH - ((yVal - yMin) / (yMax - yMin)) * plotH;

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';

      for (let yVal = -0.5; yVal <= yMax; yVal += 0.5) {
        const y = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText((yVal >= 0 ? '+' : '') + yVal.toFixed(1) + '°C', padding.left - 8, y + 4);
      }

      ctx.textAlign = 'center';
      for (let xVal = 280; xVal <= 420; xVal += 30) {
        const x = getX(xVal);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
        ctx.fillText(xVal + ' ppm', x, height - padding.bottom + 16);
      }

      // Regression Line
      if (config.regression) {
        const { slope, intercept, r2 } = config.regression;
        const x1 = xMin;
        const y1 = slope * x1 + intercept;
        const x2 = xMax;
        const y2 = slope * x2 + intercept;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(getX(x1), getY(y1));
        ctx.lineTo(getX(x2), getY(y2));
        ctx.stroke();
        ctx.setLineDash([]);

        // R² Badge
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(width - padding.right - 130, padding.top + 8, 125, 26);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.strokeRect(width - padding.right - 130, padding.top + 8, 125, 26);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`R² = ${r2.toFixed(3)} (p < 0.001)`, width - padding.right - 67, padding.top + 25);
      }

      // Draw Data Points
      points.forEach(p => {
        const px = getX(p.x);
        const py = getY(p.y);
        
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.year >= 2000 ? '#ef4444' : (p.year >= 1950 ? '#f59e0b' : '#38bdf8');
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Hover Tooltip
      canvas.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let closest = null;
        let minD = 15;
        points.forEach(p => {
          const px = getX(p.x);
          const py = getY(p.y);
          const dist = Math.hypot(mx - px, my - py);
          if (dist < minD) {
            minD = dist;
            closest = p;
          }
        });

        if (closest) {
          const tip = `<strong style="color: #38bdf8">Year: ${closest.year}</strong>
            <div style="margin-top: 4px;">CO₂: <strong>${closest.x.toFixed(1)} ppm</strong></div>
            <div>Temp Anomaly: <strong style="color:#f87171">${(closest.y >= 0 ? '+' : '') + closest.y.toFixed(2)}°C</strong></div>`;
          showTooltip(e.clientX, e.clientY, tip);
        } else {
          hideTooltip();
        }
      };
      canvas.onmouseleave = hideTooltip;
    },

    /**
     * Donut Chart (GHG breakdown by gas and sector)
     */
    renderDonutChart: function(canvasId, config) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const { ctx, width, height } = setupCanvas(canvas);
      const items = config.items || []; // [{ label, value, color }]
      if (!items.length) return;

      const total = items.reduce((acc, it) => acc + it.value, 0);
      const cx = width * 0.38;
      const cy = height * 0.5;
      const radius = Math.min(cx, cy) - 20;
      const innerRadius = radius * 0.55;

      let currentAngle = -Math.PI / 2;

      items.forEach(it => {
        const sliceAngle = (it.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(cx, cy, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.strokeStyle = '#0a0f1d';
        ctx.lineWidth = 2;
        ctx.stroke();

        it._start = currentAngle;
        it._end = currentAngle + sliceAngle;
        currentAngle += sliceAngle;
      });

      // Center Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.centerText || 'GHG Share', cx, cy - 8);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(config.centerSub || '100%', cx, cy + 12);

      // Legends on right
      const legendX = width * 0.72;
      const legendStartY = cy - (items.length * 13);
      items.forEach((it, i) => {
        const ly = legendStartY + i * 26;
        ctx.fillStyle = it.color;
        ctx.fillRect(legendX - 25, ly - 6, 12, 12);
        
        ctx.fillStyle = '#f8fafc';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(it.label, legendX - 6, ly + 2);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${it.value}%`, legendX - 6, ly + 16);
      });
    },

    /**
     * Warming Stripes ("Show Your Stripes" Ed Hawkins Barcode)
     */
    renderWarmingStripes: function(containerId, stripesData) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';
      stripesData.forEach(st => {
        const bar = document.createElement('div');
        bar.className = 'stripe-bar';
        
        // Map normalized anomaly to color
        // -1.0 to +1.0
        const norm = st.norm; // -1 to 1
        let color = '#38bdf8';
        if (norm < -0.6) color = '#08306b';
        else if (norm < -0.3) color = '#2171b5';
        else if (norm < -0.1) color = '#6baed6';
        else if (norm < 0.1) color = '#f7f7f7';
        else if (norm < 0.3) color = '#fcbba1';
        else if (norm < 0.6) color = '#fb6a4a';
        else if (norm < 0.8) color = '#cb181d';
        else color = '#67000d';

        bar.style.backgroundColor = color;
        bar.title = `${st.year}: ${(st.anomaly >= 0 ? '+' : '') + st.anomaly.toFixed(2)}°C`;
        
        bar.addEventListener('mouseenter', e => {
          showTooltip(e.clientX, e.clientY, `
            <div style="font-weight: 700; color: #38bdf8">${st.year}</div>
            <div>Temp: <strong>${st.temp.toFixed(2)}°C</strong></div>
            <div>Anomaly: <strong style="color:${norm >= 0 ? '#ef4444' : '#38bdf8'}">${(st.anomaly >= 0 ? '+' : '') + st.anomaly.toFixed(2)}°C</strong></div>
          `);
        });
        bar.addEventListener('mouseleave', hideTooltip);

        container.appendChild(bar);
      });
    }
  };
})();
