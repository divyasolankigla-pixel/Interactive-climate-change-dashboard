/**
 * Interactive Climate Change Dashboard - World Map & Climate Station Heatmap
 * Visualizes 100 Major Global Climate Stations with precise coordinates and warming deltas.
 */

window.ClimateMap = (function() {
  let mapCanvas = null;
  let mapCtx = null;
  let citiesData = [];
  let filteredCities = [];
  let activeCity = null;
  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // Equirectangular projection convert Lat/Lon to Canvas X/Y
  function project(lat, lon, width, height) {
    // Lat: -90 to 90 -> Y: height to 0
    // Lon: -180 to 180 -> X: 0 to width
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }

  function getStationColor(delta) {
    if (delta >= 1.6) return '#ef4444'; // Red
    if (delta >= 1.3) return '#f97316'; // Orange
    if (delta >= 1.0) return '#f59e0b'; // Amber
    if (delta >= 0.7) return '#38bdf8'; // Cyan
    return '#10b981';                   // Emerald
  }

  function drawWorldOutlines(ctx, w, h) {
    // Clean stylized equirectangular world grid & continents
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Latitudes (Tropics, Equator, Arctic)
    [-66.5, -23.5, 0, 23.5, 66.5].forEach(lat => {
      const { y } = project(lat, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '10px sans-serif';
      ctx.fillText(lat === 0 ? 'Equator 0°' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`, 8, y - 3);
    });

    // Meridians
    [-120, -60, 0, 60, 120].forEach(lon => {
      const { x } = project(0, lon, w, h);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    });

    // Stylized landmass polygons for background context
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;

    // Approximate continent hulls for visual geography
    const continents = [
      // North America
      [[70,-160],[70,-60],[50,-55],[30,-80],[15,-90],[20,-105],[30,-120],[55,-130],[65,-165]],
      // South America
      [[10,-75],[ -5,-35],[-25,-45],[-55,-70],[-40,-75],[-10,-80],[5,-75]],
      // Europe
      [[70,25],[60,30],[45,35],[35,-5],[45,-10],[55,10],[70,25]],
      // Africa
      [[35,-5],[30,32],[10,50],[-5,40],[-35,20],[-35,15],[5,10],[15,-15],[35,-5]],
      // Asia
      [[75,100],[65,170],[35,140],[20,110],[10,100],[25,60],[40,50],[70,40],[75,80]],
      // Australia
      [[-15,130],[-12,145],[-35,150],[-38,140],[-32,115],[-20,115]]
    ];

    continents.forEach(poly => {
      ctx.beginPath();
      poly.forEach(([cLat, cLon], i) => {
        const pt = project(cLat, cLon, w, h);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  function render() {
    if (!mapCanvas || !mapCtx) return;
    const w = mapCanvas.width;
    const h = mapCanvas.height;

    mapCtx.clearRect(0, 0, w, h);

    // Save state for Pan & Zoom
    mapCtx.save();
    mapCtx.translate(panX, panY);
    mapCtx.scale(zoomLevel, zoomLevel);

    // Background ocean fill
    mapCtx.fillStyle = '#0a101f';
    mapCtx.fillRect(0, 0, w, h);

    // Draw Geography
    drawWorldOutlines(mapCtx, w, h);

    // Draw Stations
    filteredCities.forEach(city => {
      const pt = project(city.lat, city.lon, w, h);
      const color = getStationColor(city.warming_delta);
      const isSelected = activeCity && activeCity.city === city.city;

      // Glow Halo
      mapCtx.beginPath();
      mapCtx.arc(pt.x, pt.y, isSelected ? 14 : 7, 0, Math.PI * 2);
      mapCtx.fillStyle = color + (isSelected ? '44' : '22');
      mapCtx.fill();

      // Station Core Pin
      mapCtx.beginPath();
      mapCtx.arc(pt.x, pt.y, isSelected ? 6 : 3.5, 0, Math.PI * 2);
      mapCtx.fillStyle = color;
      mapCtx.fill();
      mapCtx.strokeStyle = '#ffffff';
      mapCtx.lineWidth = isSelected ? 2 : 0.8;
      mapCtx.stroke();

      // Station Label if selected or high warming
      if (isSelected || zoomLevel > 1.6 || city.warming_delta >= 1.6) {
        mapCtx.fillStyle = '#f8fafc';
        mapCtx.font = (isSelected ? 'bold 12px' : '10px') + ' sans-serif';
        mapCtx.fillText(`${city.city} (+${city.warming_delta}°C)`, pt.x + 8, pt.y + 3);
      }
    });

    mapCtx.restore();
  }

  return {
    init: function(canvasId, cities) {
      mapCanvas = document.getElementById(canvasId);
      if (!mapCanvas) return;

      const rect = mapCanvas.parentElement.getBoundingClientRect();
      mapCanvas.width = rect.width || 800;
      mapCanvas.height = Math.max(420, Math.min(560, (rect.width || 800) * 0.5));
      mapCtx = mapCanvas.getContext('2d');

      citiesData = cities || [];
      filteredCities = [...citiesData];

      // Mouse Hover & Click Detection
      mapCanvas.onmousemove = function(e) {
        if (isDragging) {
          panX += e.clientX - dragStartX;
          panY += e.clientY - dragStartY;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          render();
          return;
        }

        const rect = mapCanvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - panX) / zoomLevel;
        const my = (e.clientY - rect.top - panY) / zoomLevel;

        const w = mapCanvas.width;
        const h = mapCanvas.height;

        let hovered = null;
        for (let city of filteredCities) {
          const pt = project(city.lat, city.lon, w, h);
          if (Math.hypot(mx - pt.x, my - pt.y) < 10) {
            hovered = city;
            break;
          }
        }

        if (hovered) {
          mapCanvas.style.cursor = 'pointer';
          const tip = `
            <div style="font-weight: 700; color: #38bdf8; font-size: 0.95rem;">${hovered.city}, ${hovered.country}</div>
            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px;">Lat: ${hovered.lat_str} | Lon: ${hovered.lon_str}</div>
            <div style="display:flex; justify-content:space-between; gap:10px;">
              <span>Pre-1930 Baseline:</span> <strong>${hovered.baseline_temp}°C</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:10px;">
              <span>Recent Mean:</span> <strong>${hovered.recent_temp}°C</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:10px; margin-top:2px;">
              <span>Total Warming:</span> <strong style="color:${getStationColor(hovered.warming_delta)}">+${hovered.warming_delta}°C</strong>
            </div>
          `;
          const tooltip = document.querySelector('.custom-tooltip') || document.createElement('div');
          tooltip.className = 'custom-tooltip';
          tooltip.innerHTML = tip;
          tooltip.style.display = 'block';
          tooltip.style.left = `${Math.min(window.innerWidth - 220, e.clientX + 14)}px`;
          tooltip.style.top = `${e.clientY + 14}px`;
          if (!tooltip.parentElement) document.body.appendChild(tooltip);
        } else {
          mapCanvas.style.cursor = 'default';
          const tip = document.querySelector('.custom-tooltip');
          if (tip) tip.style.display = 'none';
        }
      };

      mapCanvas.onclick = function(e) {
        const rect = mapCanvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - panX) / zoomLevel;
        const my = (e.clientY - rect.top - panY) / zoomLevel;
        const w = mapCanvas.width;
        const h = mapCanvas.height;

        for (let city of filteredCities) {
          const pt = project(city.lat, city.lon, w, h);
          if (Math.hypot(mx - pt.x, my - pt.y) < 12) {
            ClimateMap.selectCity(city.city);
            break;
          }
        }
      };

      // Zoom Controls
      mapCanvas.onwheel = function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomLevel = Math.max(1.0, Math.min(3.5, zoomLevel * delta));
        if (zoomLevel === 1.0) { panX = 0; panY = 0; }
        render();
      };

      window.addEventListener('resize', () => {
        if (!mapCanvas) return;
        const rect = mapCanvas.parentElement.getBoundingClientRect();
        mapCanvas.width = rect.width || 800;
        mapCanvas.height = Math.max(420, Math.min(560, (rect.width || 800) * 0.5));
        render();
      });

      render();
    },

    filterByZone: function(zone) {
      if (zone === 'all') {
        filteredCities = [...citiesData];
      } else if (zone === 'polar') {
        filteredCities = citiesData.filter(c => Math.abs(c.lat) >= 50);
      } else if (zone === 'temperate') {
        filteredCities = citiesData.filter(c => Math.abs(c.lat) >= 23.5 && Math.abs(c.lat) < 50);
      } else if (zone === 'tropical') {
        filteredCities = citiesData.filter(c => Math.abs(c.lat) < 23.5);
      } else if (zone === 'high_warming') {
        filteredCities = citiesData.filter(c => c.warming_delta >= 1.4);
      }
      render();
    },

    selectCity: function(cityName) {
      activeCity = citiesData.find(c => c.city.toLowerCase() === cityName.toLowerCase()) || null;
      render();
      if (activeCity && window.onCitySelected) {
        window.onCitySelected(activeCity);
      }
    },

    resetZoom: function() {
      zoomLevel = 1.0;
      panX = 0;
      panY = 0;
      render();
    }
  };
})();
