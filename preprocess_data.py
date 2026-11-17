"""
Interactive Climate Change Dashboard - Data Preprocessing Pipeline
==================================================================
This script processes the raw Berkeley Earth Surface Temperature datasets:
- GlobalTemperatures.csv
- GlobalLandTemperaturesByCountry.csv
- GlobalLandTemperaturesByMajorCity.csv

And compiles authoritative climate indicator data:
- Atmospheric CO2 concentration (ppm) [Law Dome + NOAA Mauna Loa]
- Global Fossil Fuel CO2 emissions by source (Gt CO2) [Global Carbon Project / CDIAC]
- Major Country Historical & Per-Capita Emissions [Our World in Data]
- Greenhouse Gas Breakdown (CO2, CH4, N2O, F-gases) and Sectoral distribution
- Environmental Indicators: Sea Level Rise (mm), Arctic Sea Ice Extent (M km²)
- IPCC Scenario Projections (SSPs)
"""

import os
import csv
import json
import math
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'static', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

print("Starting Climate Data Preprocessing Pipeline...")

# ==============================================================================
# 1. PROCESS GLOBAL TEMPERATURES
# ==============================================================================
print("1/5: Processing GlobalTemperatures.csv...")

global_temp_path = os.path.join(BASE_DIR, 'GlobalTemperatures.csv')

# Structure: year -> list of monthly temperatures
yearly_land = defaultdict(list)
yearly_land_uncertainty = defaultdict(list)
yearly_land_ocean = defaultdict(list)
yearly_land_ocean_uncertainty = defaultdict(list)
yearly_land_max = defaultdict(list)
yearly_land_min = defaultdict(list)
monthly_global = defaultdict(lambda: defaultdict(list)) # month(1-12) -> year -> temp

with open(global_temp_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        dt = row['dt']
        year = int(dt.split('-')[0])
        month = int(dt.split('-')[1])
        
        if row['LandAverageTemperature']:
            val = float(row['LandAverageTemperature'])
            yearly_land[year].append(val)
            monthly_global[month][year].append(val)
            
        if row['LandAverageTemperatureUncertainty']:
            yearly_land_uncertainty[year].append(float(row['LandAverageTemperatureUncertainty']))
            
        if row['LandAndOceanAverageTemperature']:
            yearly_land_ocean[year].append(float(row['LandAndOceanAverageTemperature']))
            
        if row['LandAndOceanAverageTemperatureUncertainty']:
            yearly_land_ocean_uncertainty[year].append(float(row['LandAndOceanAverageTemperatureUncertainty']))
            
        if row['LandMaxTemperature']:
            yearly_land_max[year].append(float(row['LandMaxTemperature']))
            
        if row['LandMinTemperature']:
            yearly_land_min[year].append(float(row['LandMinTemperature']))

# Calculate Climatological Baselines
# Pre-industrial baseline: 1850-1900 (standard IPCC baseline)
# Mid-century baseline: 1951-1980 (standard NASA GISS baseline)
base_1850_1900_land = []
base_1951_1980_land = []
base_1850_1900_ocean = []
base_1951_1980_ocean = []

for y in range(1850, 1901):
    if y in yearly_land and yearly_land[y]:
        base_1850_1900_land.append(sum(yearly_land[y]) / len(yearly_land[y]))
    if y in yearly_land_ocean and yearly_land_ocean[y]:
        base_1850_1900_ocean.append(sum(yearly_land_ocean[y]) / len(yearly_land_ocean[y]))

for y in range(1951, 1981):
    if y in yearly_land and yearly_land[y]:
        base_1951_1980_land.append(sum(yearly_land[y]) / len(yearly_land[y]))
    if y in yearly_land_ocean and yearly_land_ocean[y]:
        base_1951_1980_ocean.append(sum(yearly_land_ocean[y]) / len(yearly_land_ocean[y]))

baseline_preind_land = sum(base_1850_1900_land) / len(base_1850_1900_land)
baseline_nasa_land = sum(base_1951_1980_land) / len(base_1951_1980_land)
baseline_preind_ocean = sum(base_1850_1900_ocean) / len(base_1850_1900_ocean) if base_1850_1900_ocean else 14.85
baseline_nasa_ocean = sum(base_1951_1980_ocean) / len(base_1951_1980_ocean)

print(f"  Pre-industrial baseline (1850-1900): Land={baseline_preind_land:.2f}°C, Land+Ocean={baseline_preind_ocean:.2f}°C")
print(f"  NASA GISS baseline (1951-1980): Land={baseline_nasa_land:.2f}°C, Land+Ocean={baseline_nasa_ocean:.2f}°C")

# Build yearly time-series
years_sorted = sorted([y for y in yearly_land.keys() if len(yearly_land[y]) >= 6])
global_yearly_series = []

for y in years_sorted:
    land_avg = sum(yearly_land[y]) / len(yearly_land[y])
    land_unc = sum(yearly_land_uncertainty[y]) / len(yearly_land_uncertainty[y]) if yearly_land_uncertainty[y] else 0.1
    
    ocean_avg = sum(yearly_land_ocean[y]) / len(yearly_land_ocean[y]) if yearly_land_ocean[y] else None
    ocean_unc = sum(yearly_land_ocean_uncertainty[y]) / len(yearly_land_ocean_uncertainty[y]) if yearly_land_ocean_uncertainty[y] else None
    
    max_avg = sum(yearly_land_max[y]) / len(yearly_land_max[y]) if yearly_land_max[y] else None
    min_avg = sum(yearly_land_min[y]) / len(yearly_land_min[y]) if yearly_land_min[y] else None
    
    # Anomaly relative to pre-industrial (1850-1900)
    land_anomaly_preind = land_avg - baseline_preind_land
    ocean_anomaly_preind = (ocean_avg - baseline_preind_ocean) if ocean_avg is not None else None
    
    # Anomaly relative to 1951-1980
    land_anomaly_nasa = land_avg - baseline_nasa_land
    ocean_anomaly_nasa = (ocean_avg - baseline_nasa_ocean) if ocean_avg is not None else None
    
    global_yearly_series.append({
        'year': y,
        'land_temp': round(land_avg, 3),
        'land_unc': round(land_unc, 3),
        'land_ocean_temp': round(ocean_avg, 3) if ocean_avg is not None else None,
        'land_ocean_unc': round(ocean_unc, 3) if ocean_unc is not None else None,
        'land_max': round(max_avg, 3) if max_avg is not None else None,
        'land_min': round(min_avg, 3) if min_avg is not None else None,
        'anomaly_preind_land': round(land_anomaly_preind, 3),
        'anomaly_preind_ocean': round(ocean_anomaly_preind, 3) if ocean_anomaly_preind is not None else None,
        'anomaly_nasa_land': round(land_anomaly_nasa, 3),
        'anomaly_nasa_ocean': round(ocean_anomaly_nasa, 3) if ocean_anomaly_nasa is not None else None
    })

# Compute 5-year and 10-year rolling moving averages
for i, item in enumerate(global_yearly_series):
    # 5-year rolling
    start_5 = max(0, i - 2)
    end_5 = min(len(global_yearly_series), i + 3)
    slice_5_land = [x['land_temp'] for x in global_yearly_series[start_5:end_5]]
    slice_5_anom = [x['anomaly_preind_land'] for x in global_yearly_series[start_5:end_5]]
    item['land_temp_5yr_ma'] = round(sum(slice_5_land) / len(slice_5_land), 3)
    item['anomaly_5yr_ma'] = round(sum(slice_5_anom) / len(slice_5_anom), 3)
    
    # 10-year rolling
    start_10 = max(0, i - 4)
    end_10 = min(len(global_yearly_series), i + 6)
    slice_10_land = [x['land_temp'] for x in global_yearly_series[start_10:end_10]]
    slice_10_anom = [x['anomaly_preind_land'] for x in global_yearly_series[start_10:end_10]]
    item['land_temp_10yr_ma'] = round(sum(slice_10_land) / len(slice_10_land), 3)
    item['anomaly_10yr_ma'] = round(sum(slice_10_anom) / len(slice_10_anom), 3)

# Decadal Warming Stripes (Ed Hawkins format)
# Reference: 1971-2000 or 1951-1980 baseline
# Standard color scale mapping: -1.5°C (deep blue #08306b) to +1.5°C (deep red #67000d)
stripes_data = []
for item in global_yearly_series:
    if item['year'] >= 1850:
        anom = item['anomaly_nasa_land']
        # Normalized score from -1.5 to +1.5 mapped to -1 to +1
        norm = max(-1.0, min(1.0, anom / 1.5))
        stripes_data.append({
            'year': item['year'],
            'temp': item['land_temp'],
            'anomaly': anom,
            'norm': round(norm, 3)
        })

# Extend series to 2024 using NOAA / NASA GISS verified global land+ocean anomalies
# 2016-2024 recent records
recent_estimates = [
    {'year': 2016, 'land_temp': 10.02, 'land_ocean_temp': 15.35, 'anomaly_preind_land': 1.64, 'anomaly_preind_ocean': 1.05},
    {'year': 2017, 'land_temp': 9.87,  'land_ocean_temp': 15.22, 'anomaly_preind_land': 1.49, 'anomaly_preind_ocean': 0.93},
    {'year': 2018, 'land_temp': 9.81,  'land_ocean_temp': 15.16, 'anomaly_preind_land': 1.43, 'anomaly_preind_ocean': 0.86},
    {'year': 2019, 'land_temp': 9.94,  'land_ocean_temp': 15.28, 'anomaly_preind_land': 1.56, 'anomaly_preind_ocean': 0.98},
    {'year': 2020, 'land_temp': 10.05, 'land_ocean_temp': 15.34, 'anomaly_preind_land': 1.67, 'anomaly_preind_ocean': 1.04},
    {'year': 2021, 'land_temp': 9.83,  'land_ocean_temp': 15.18, 'anomaly_preind_land': 1.45, 'anomaly_preind_ocean': 0.88},
    {'year': 2022, 'land_temp': 9.89,  'land_ocean_temp': 15.23, 'anomaly_preind_land': 1.51, 'anomaly_preind_ocean': 0.92},
    {'year': 2023, 'land_temp': 10.28, 'land_ocean_temp': 15.48, 'anomaly_preind_land': 1.90, 'anomaly_preind_ocean': 1.18},
    {'year': 2024, 'land_temp': 10.42, 'land_ocean_temp': 15.61, 'anomaly_preind_land': 2.04, 'anomaly_preind_ocean': 1.31}
]

for rec in recent_estimates:
    rec['land_unc'] = 0.04
    rec['land_ocean_unc'] = 0.03
    rec['anomaly_nasa_land'] = round(rec['land_temp'] - baseline_nasa_land, 3)
    rec['anomaly_nasa_ocean'] = round(rec['land_ocean_temp'] - baseline_nasa_ocean, 3)
    rec['land_temp_5yr_ma'] = round(rec['land_temp'], 3)
    rec['anomaly_5yr_ma'] = round(rec['anomaly_preind_land'], 3)
    rec['land_temp_10yr_ma'] = round(rec['land_temp'], 3)
    rec['anomaly_10yr_ma'] = round(rec['anomaly_preind_land'], 3)
    global_yearly_series.append(rec)
    
    anom = rec['anomaly_nasa_land']
    norm = max(-1.0, min(1.0, anom / 1.5))
    stripes_data.append({
        'year': rec['year'],
        'temp': rec['land_temp'],
        'anomaly': anom,
        'norm': round(norm, 3)
    })

# Monthly seasonal analysis
months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
monthly_climatology = []
for m in range(1, 13):
    temps = [t for y, tlist in monthly_global[m].items() if 1951 <= y <= 1980 for t in tlist]
    avg_m = sum(temps) / len(temps) if temps else 0
    # Recent decade monthly (2000-2015)
    recent_m = [t for y, tlist in monthly_global[m].items() if y >= 2000 for t in tlist]
    avg_recent_m = sum(recent_m) / len(recent_m) if recent_m else 0
    monthly_climatology.append({
        'month_num': m,
        'month': months_labels[m-1],
        'baseline_temp': round(avg_m, 2),
        'recent_temp': round(avg_recent_m, 2),
        'warming_delta': round(avg_recent_m - avg_m, 2)
    })

global_climate_data = {
    'baselines': {
        'preindustrial_land_1850_1900': round(baseline_preind_land, 2),
        'preindustrial_ocean_1850_1900': round(baseline_preind_ocean, 2),
        'nasa_land_1951_1980': round(baseline_nasa_land, 2),
        'nasa_ocean_1951_1980': round(baseline_nasa_ocean, 2),
    },
    'yearly_series': global_yearly_series,
    'stripes': stripes_data,
    'monthly_climatology': monthly_climatology
}

with open(os.path.join(DATA_DIR, 'global_climate.json'), 'w', encoding='utf-8') as f:
    json.dump(global_climate_data, f, indent=2)

print(f"  Saved global_climate.json ({len(global_yearly_series)} years).")

# ==============================================================================
# 2. PROCESS MAJOR CITIES (GlobalLandTemperaturesByMajorCity.csv)
# ==============================================================================
print("2/5: Processing GlobalLandTemperaturesByMajorCity.csv...")

cities_path = os.path.join(BASE_DIR, 'GlobalLandTemperaturesByMajorCity.csv')
city_records = defaultdict(lambda: {
    'country': '',
    'lat': '',
    'lon': '',
    'yearly_temps': defaultdict(list),
    'monthly_temps': defaultdict(lambda: defaultdict(list))
})

with open(cities_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not row['AverageTemperature']:
            continue
        city = row['City']
        country = row['Country']
        lat = row['Latitude']
        lon = row['Longitude']
        dt = row['dt']
        year = int(dt.split('-')[0])
        month = int(dt.split('-')[1])
        temp = float(row['AverageTemperature'])
        
        c_entry = city_records[city]
        c_entry['country'] = country
        c_entry['lat'] = lat
        c_entry['lon'] = lon
        c_entry['yearly_temps'][year].append(temp)
        c_entry['monthly_temps'][month][year].append(temp)

def parse_lat_lon(coord_str, is_lat=True):
    val = float(coord_str[:-1])
    direction = coord_str[-1].upper()
    if is_lat:
        return val if direction == 'N' else -val
    else:
        return val if direction == 'E' else -val

cities_summary = []
for city, data in city_records.items():
    country = data['country']
    lat_deg = parse_lat_lon(data['lat'], is_lat=True)
    lon_deg = parse_lat_lon(data['lon'], is_lat=False)
    
    # Calculate baseline (1900-1950 or earliest 50 years)
    years = sorted(data['yearly_temps'].keys())
    if not years:
        continue
        
    early_years = [y for y in years if y < 1930]
    recent_years = [y for y in years if y >= 1990]
    
    early_temps = [sum(data['yearly_temps'][y])/len(data['yearly_temps'][y]) for y in early_years if len(data['yearly_temps'][y]) >= 6]
    recent_temps = [sum(data['yearly_temps'][y])/len(data['yearly_temps'][y]) for y in recent_years if len(data['yearly_temps'][y]) >= 6]
    
    baseline_temp = sum(early_temps) / len(early_temps) if early_temps else 15.0
    recent_temp = sum(recent_temps) / len(recent_temps) if recent_temps else baseline_temp
    warming_delta = recent_temp - baseline_temp
    
    # Sample yearly timeline for charts (every 5-10 years or continuous)
    timeline = []
    for y in years:
        if len(data['yearly_temps'][y]) >= 6:
            avg_y = sum(data['yearly_temps'][y]) / len(data['yearly_temps'][y])
            timeline.append({
                'year': y,
                'temp': round(avg_y, 2),
                'anomaly': round(avg_y - baseline_temp, 2)
            })
            
    # Monthly averages
    monthly_avgs = []
    for m in range(1, 13):
        m_temps = [t for y, tlist in data['monthly_temps'][m].items() for t in tlist]
        monthly_avgs.append(round(sum(m_temps)/len(m_temps), 1) if m_temps else 0)
        
    cities_summary.append({
        'city': city,
        'country': country,
        'lat_str': data['lat'],
        'lon_str': data['lon'],
        'lat': round(lat_deg, 4),
        'lon': round(lon_deg, 4),
        'baseline_temp': round(baseline_temp, 2),
        'recent_temp': round(recent_temp, 2),
        'warming_delta': round(warming_delta, 2),
        'start_year': years[0],
        'end_year': years[-1],
        'monthly_avgs': monthly_avgs,
        'timeline': timeline
    })

# Sort cities by warming delta descending
cities_summary.sort(key=lambda x: x['warming_delta'], reverse=True)

with open(os.path.join(DATA_DIR, 'cities_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(cities_summary, f, indent=2)

print(f"  Saved cities_summary.json ({len(cities_summary)} cities). Top warming: {cities_summary[0]['city']} (+{cities_summary[0]['warming_delta']}°C).")

# ==============================================================================
# 3. PROCESS COUNTRIES (GlobalLandTemperaturesByCountry.csv)
# ==============================================================================
print("3/5: Processing GlobalLandTemperaturesByCountry.csv...")

countries_path = os.path.join(BASE_DIR, 'GlobalLandTemperaturesByCountry.csv')
country_records = defaultdict(lambda: defaultdict(list))

with open(countries_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not row['AverageTemperature']:
            continue
        country = row['Country']
        year = int(row['dt'].split('-')[0])
        temp = float(row['AverageTemperature'])
        country_records[country][year].append(temp)

countries_summary = []
# Filter out duplicated region aggregates or territories if needed, keep countries
for country, yearly in country_records.items():
    years = sorted(yearly.keys())
    if len(years) < 30:
        continue
        
    early_years = [y for y in years if 1850 <= y <= 1900]
    if not early_years:
        early_years = [y for y in years if y < 1920]
        
    recent_years = [y for y in years if y >= 1990]
    
    early_temps = [sum(yearly[y])/len(yearly[y]) for y in early_years if len(yearly[y]) >= 6]
    recent_temps = [sum(yearly[y])/len(yearly[y]) for y in recent_years if len(yearly[y]) >= 6]
    
    if not early_temps or not recent_temps:
        continue
        
    baseline_temp = sum(early_temps) / len(early_temps)
    recent_temp = sum(recent_temps) / len(recent_temps)
    warming_delta = recent_temp - baseline_temp
    
    # Compact yearly timeline for country comparison charts
    timeline = []
    for y in years:
        if y >= 1850 and len(yearly[y]) >= 6:
            avg_y = sum(yearly[y]) / len(yearly[y])
            timeline.append({
                'year': y,
                'temp': round(avg_y, 2),
                'anomaly': round(avg_y - baseline_temp, 2)
            })
            
    countries_summary.append({
        'country': country,
        'baseline_temp': round(baseline_temp, 2),
        'recent_temp': round(recent_temp, 2),
        'warming_delta': round(warming_delta, 2),
        'start_year': years[0],
        'end_year': years[-1],
        'timeline': timeline
    })

countries_summary.sort(key=lambda x: x['warming_delta'], reverse=True)

with open(os.path.join(DATA_DIR, 'countries_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(countries_summary, f, indent=2)

print(f"  Saved countries_summary.json ({len(countries_summary)} countries).")

# ==============================================================================
# 4. COMPILE HISTORICAL CO2 & GREENHOUSE GAS EMISSIONS
# ==============================================================================
print("4/5: Compiling CO2 emissions and Greenhouse Gas datasets...")

# Atmospheric CO2 (ppm) from 1750 to 2024
# Sources: NOAA Global Monitoring Laboratory (Mauna Loa) + Law Dome Ice Core (Etheridge et al.)
co2_ppm_historical = [
    (1750, 277.0), (1760, 277.3), (1770, 277.8), (1780, 278.4), (1790, 279.1),
    (1800, 282.9), (1810, 283.4), (1820, 283.8), (1830, 284.4), (1840, 285.2),
    (1850, 285.8), (1860, 287.0), (1870, 289.0), (1880, 290.8), (1890, 294.4),
    (1900, 296.0), (1910, 300.1), (1920, 303.4), (1930, 307.0), (1940, 310.0),
    (1950, 311.3), (1955, 313.5), (1958, 315.2), (1960, 316.9), (1965, 320.0),
    (1970, 325.7), (1975, 331.1), (1980, 338.8), (1985, 346.1), (1990, 354.4),
    (1995, 360.8), (2000, 369.5), (2005, 379.8), (2010, 389.9), (2015, 400.8),
    (2018, 408.5), (2020, 414.2), (2021, 416.5), (2022, 418.6), (2023, 421.1), (2024, 425.2)
]

# Interpolate yearly ppm for smooth charting
co2_ppm_dict = {}
for i in range(len(co2_ppm_historical) - 1):
    y1, v1 = co2_ppm_historical[i]
    y2, v2 = co2_ppm_historical[i+1]
    for y in range(y1, y2):
        frac = (y - y1) / (y2 - y1)
        co2_ppm_dict[y] = round(v1 + frac * (v2 - v1), 2)
co2_ppm_dict[co2_ppm_historical[-1][0]] = co2_ppm_historical[-1][1]

# Global CO2 Emissions by Fuel / Source (Gigatonnes of CO2 per year)
# Source: Global Carbon Project (Friedlingstein et al. 2024)
emissions_timeline = [
    # Year, Coal, Oil, Gas, Cement, Flaring, Total
    (1800, 0.03, 0.0, 0.0, 0.0, 0.0, 0.03),
    (1850, 0.20, 0.0, 0.0, 0.0, 0.0, 0.20),
    (1880, 0.85, 0.01, 0.0, 0.0, 0.0, 0.86),
    (1900, 1.86, 0.08, 0.01, 0.0, 0.0, 1.95),
    (1920, 3.12, 0.44, 0.06, 0.02, 0.0, 3.64),
    (1940, 3.75, 1.10, 0.22, 0.04, 0.01, 5.12),
    (1950, 4.02, 1.33, 0.53, 0.07, 0.05, 6.00),
    (1960, 5.12, 3.18, 1.02, 0.15, 0.10, 9.57),
    (1970, 6.05, 6.55, 2.05, 0.28, 0.20, 15.13),
    (1980, 7.82, 9.42, 3.32, 0.44, 0.28, 21.28),
    (1990, 9.05, 9.85, 4.38, 0.58, 0.30, 24.16),
    (1995, 9.52, 10.42, 4.88, 0.72, 0.32, 25.86),
    (2000, 10.15, 11.22, 5.48, 0.85, 0.35, 28.05),
    (2005, 12.35, 12.05, 6.22, 1.15, 0.38, 32.15),
    (2010, 14.12, 12.28, 6.95, 1.38, 0.40, 35.13),
    (2015, 14.78, 12.65, 7.42, 1.45, 0.42, 36.72),
    (2018, 15.12, 12.95, 7.85, 1.52, 0.44, 37.88),
    (2019, 15.18, 13.02, 8.02, 1.55, 0.43, 38.20),
    (2020, 14.65, 11.85, 7.88, 1.58, 0.41, 36.37), # Covid dip
    (2021, 15.22, 12.45, 8.22, 1.62, 0.42, 37.93),
    (2022, 15.45, 12.68, 8.18, 1.61, 0.43, 38.35),
    (2023, 15.62, 12.80, 8.25, 1.63, 0.44, 38.74),
    (2024, 15.75, 12.90, 8.32, 1.65, 0.45, 39.07)
]

# Interpolate all years 1900 to 2024
interpolated_emissions = []
for i in range(len(emissions_timeline) - 1):
    y1, c1, o1, g1, ce1, fl1, tot1 = emissions_timeline[i]
    y2, c2, o2, g2, ce2, fl2, tot2 = emissions_timeline[i+1]
    for y in range(y1, y2):
        frac = (y - y1) / (y2 - y1)
        interpolated_emissions.append({
            'year': y,
            'coal': round(c1 + frac * (c2 - c1), 3),
            'oil': round(o1 + frac * (o2 - o1), 3),
            'gas': round(g1 + frac * (g2 - g1), 3),
            'cement': round(ce1 + frac * (ce2 - ce1), 3),
            'flaring': round(fl1 + frac * (fl2 - fl1), 3),
            'total': round(tot1 + frac * (tot2 - tot1), 3),
            'co2_ppm': co2_ppm_dict.get(y, None)
        })

last = emissions_timeline[-1]
interpolated_emissions.append({
    'year': last[0], 'coal': last[1], 'oil': last[2], 'gas': last[3],
    'cement': last[4], 'flaring': last[5], 'total': last[6],
    'co2_ppm': co2_ppm_dict.get(last[0], 425.2)
})

# Country-level Emissions (Total Mt CO2/yr and Per Capita tonnes/person)
# Top 15 historical & contemporary emitters
countries_emissions = [
    {
        'country': 'China',
        'code': 'CHN',
        'annual_mt': 12600,
        'per_capita_t': 8.9,
        'share_global_pct': 32.2,
        'cumulative_gt': 285.0,
        'trend_5yr': '+4.2%',
        'primary_source': 'Coal (70%)'
    },
    {
        'country': 'United States',
        'code': 'USA',
        'annual_mt': 4850,
        'per_capita_t': 14.4,
        'share_global_pct': 12.4,
        'cumulative_gt': 522.0,
        'trend_5yr': '-2.8%',
        'primary_source': 'Oil & Gas (78%)'
    },
    {
        'country': 'India',
        'code': 'IND',
        'annual_mt': 2950,
        'per_capita_t': 2.1,
        'share_global_pct': 7.5,
        'cumulative_gt': 68.0,
        'trend_5yr': '+7.1%',
        'primary_source': 'Coal (66%)'
    },
    {
        'country': 'European Union (27)',
        'code': 'EU27',
        'annual_mt': 2650,
        'per_capita_t': 5.9,
        'share_global_pct': 6.8,
        'cumulative_gt': 365.0,
        'trend_5yr': '-6.5%',
        'primary_source': 'Oil & Gas (62%)'
    },
    {
        'country': 'Russia',
        'code': 'RUS',
        'annual_mt': 1950,
        'per_capita_t': 13.5,
        'share_global_pct': 5.0,
        'cumulative_gt': 125.0,
        'trend_5yr': '+1.1%',
        'primary_source': 'Gas & Oil (76%)'
    },
    {
        'country': 'Japan',
        'code': 'JPN',
        'annual_mt': 1020,
        'per_capita_t': 8.2,
        'share_global_pct': 2.6,
        'cumulative_gt': 72.0,
        'trend_5yr': '-3.8%',
        'primary_source': 'Coal & Gas (68%)'
    },
    {
        'country': 'Indonesia',
        'code': 'IDN',
        'annual_mt': 780,
        'per_capita_t': 2.8,
        'share_global_pct': 2.0,
        'cumulative_gt': 22.0,
        'trend_5yr': '+6.8%',
        'primary_source': 'Coal & Land Use'
    },
    {
        'country': 'Iran',
        'code': 'IRN',
        'annual_mt': 740,
        'per_capita_t': 8.4,
        'share_global_pct': 1.9,
        'cumulative_gt': 25.0,
        'trend_5yr': '+2.5%',
        'primary_source': 'Gas & Oil (92%)'
    },
    {
        'country': 'Saudi Arabia',
        'code': 'SAU',
        'annual_mt': 680,
        'per_capita_t': 18.7,
        'share_global_pct': 1.7,
        'cumulative_gt': 19.5,
        'trend_5yr': '+2.2%',
        'primary_source': 'Oil & Gas (98%)'
    },
    {
        'country': 'Germany',
        'code': 'DEU',
        'annual_mt': 640,
        'per_capita_t': 7.6,
        'share_global_pct': 1.6,
        'cumulative_gt': 94.0,
        'trend_5yr': '-8.1%',
        'primary_source': 'Coal & Gas'
    },
    {
        'country': 'South Korea',
        'code': 'KOR',
        'annual_mt': 610,
        'per_capita_t': 11.8,
        'share_global_pct': 1.6,
        'cumulative_gt': 23.0,
        'trend_5yr': '-3.1%',
        'primary_source': 'Coal & Oil'
    },
    {
        'country': 'Canada',
        'code': 'CAN',
        'annual_mt': 550,
        'per_capita_t': 14.1,
        'share_global_pct': 1.4,
        'cumulative_gt': 36.0,
        'trend_5yr': '-1.5%',
        'primary_source': 'Oil & Gas (72%)'
    },
    {
        'country': 'Brazil',
        'code': 'BRA',
        'annual_mt': 490,
        'per_capita_t': 2.3,
        'share_global_pct': 1.3,
        'cumulative_gt': 18.0,
        'trend_5yr': '-1.0%',
        'primary_source': 'Oil & Transport'
    },
    {
        'country': 'United Kingdom',
        'code': 'GBR',
        'annual_mt': 330,
        'per_capita_t': 4.9,
        'share_global_pct': 0.8,
        'cumulative_gt': 80.0,
        'trend_5yr': '-7.4%',
        'primary_source': 'Gas & Oil'
    },
    {
        'country': 'Australia',
        'code': 'AUS',
        'annual_mt': 370,
        'per_capita_t': 14.2,
        'share_global_pct': 0.9,
        'cumulative_gt': 21.0,
        'trend_5yr': '-3.9%',
        'primary_source': 'Coal & Gas'
    }
]

# Greenhouse Gas Composition (IPCC 6th Assessment Report)
ghg_composition = {
    'by_gas': [
        {
            'gas': 'Carbon Dioxide (CO₂)',
            'formula': 'CO2',
            'share_pct': 74.4,
            'lifetime_years': '300 - 1,000 years',
            'gwp_100': 1,
            'primary_sources': 'Fossil fuel combustion (coal, oil, gas), industrial processes, deforestation'
        },
        {
            'gas': 'Methane (CH₄)',
            'formula': 'CH4',
            'share_pct': 17.3,
            'lifetime_years': '12 years',
            'gwp_100': 28,
            'primary_sources': 'Livestock enteric fermentation, rice cultivation, fossil fuel extraction/leaks, landfills'
        },
        {
            'gas': 'Nitrous Oxide (N₂O)',
            'formula': 'N2O',
            'share_pct': 6.2,
            'lifetime_years': '114 years',
            'gwp_100': 273,
            'primary_sources': 'Synthetic nitrogen fertilizers, agricultural soils, manure management, chemical industry'
        },
        {
            'gas': 'Fluorinated Gases (F-gases)',
            'formula': 'HFCs, PFCs, SF6, NF3',
            'share_pct': 2.1,
            'lifetime_years': 'Up to 50,000 years',
            'gwp_100': '1,000 - 24,000',
            'primary_sources': 'Refrigerants, air conditioning, semiconductor manufacturing, electrical insulation'
        }
    ],
    'by_sector': [
        {'sector': 'Energy (Electricity & Heat)', 'share_pct': 34.0, 'subsectors': ['Coal power', 'Gas turbines', 'District heating']},
        {'sector': 'Industry & Manufacturing', 'share_pct': 24.2, 'subsectors': ['Steel & iron', 'Cement production', 'Chemicals', 'Textiles']},
        {'sector': 'Agriculture, Forestry & Land Use', 'share_pct': 21.0, 'subsectors': ['Livestock', 'Deforestation', 'Fertilizers', 'Rice paddies']},
        {'sector': 'Transportation', 'share_pct': 15.0, 'subsectors': ['Road passenger/freight', 'Aviation', 'Shipping', 'Rail']},
        {'sector': 'Buildings & Residential', 'share_pct': 5.8, 'subsectors': ['Space heating', 'Cooking', 'Water heating']}
    ]
}

# Atmospheric Methane and Nitrous Oxide trajectories
non_co2_ghg_timeline = [
    {'year': 1850, 'ch4_ppb': 790,  'n2o_ppb': 273},
    {'year': 1900, 'ch4_ppb': 860,  'n2o_ppb': 279},
    {'year': 1950, 'ch4_ppb': 1140, 'n2o_ppb': 288},
    {'year': 1970, 'ch4_ppb': 1380, 'n2o_ppb': 296},
    {'year': 1980, 'ch4_ppb': 1570, 'n2o_ppb': 301},
    {'year': 1990, 'ch4_ppb': 1715, 'n2o_ppb': 308},
    {'year': 2000, 'ch4_ppb': 1773, 'n2o_ppb': 316},
    {'year': 2010, 'ch4_ppb': 1803, 'n2o_ppb': 323},
    {'year': 2015, 'ch4_ppb': 1834, 'n2o_ppb': 328},
    {'year': 2020, 'ch4_ppb': 1879, 'n2o_ppb': 333},
    {'year': 2023, 'ch4_ppb': 1922, 'n2o_ppb': 336},
    {'year': 2024, 'ch4_ppb': 1934, 'n2o_ppb': 337}
]

emissions_ghg_data = {
    'co2_ppm_historical': co2_ppm_historical,
    'emissions_timeline': interpolated_emissions,
    'countries_emissions': countries_emissions,
    'ghg_composition': ghg_composition,
    'non_co2_ghg_timeline': non_co2_ghg_timeline
}

with open(os.path.join(DATA_DIR, 'emissions_ghg.json'), 'w', encoding='utf-8') as f:
    json.dump(emissions_ghg_data, f, indent=2)

print(f"  Saved emissions_ghg.json.")

# ==============================================================================
# 5. COMPILE ENVIRONMENTAL INDICATORS & SCENARIOS
# ==============================================================================
print("5/5: Compiling Environmental Indicators and IPCC scenarios...")

# Global Mean Sea Level Rise (mm relative to 1880)
# Sources: Church and White (2011) tide gauges + CSIRO / NASA Satellite Altimetry
sea_level_timeline = [
    {'year': 1880, 'sea_level_mm': 0.0, 'source': 'Tide gauge'},
    {'year': 1890, 'sea_level_mm': 8.2, 'source': 'Tide gauge'},
    {'year': 1900, 'sea_level_mm': 17.5, 'source': 'Tide gauge'},
    {'year': 1910, 'sea_level_mm': 28.1, 'source': 'Tide gauge'},
    {'year': 1920, 'sea_level_mm': 42.0, 'source': 'Tide gauge'},
    {'year': 1930, 'sea_level_mm': 57.3, 'source': 'Tide gauge'},
    {'year': 1940, 'sea_level_mm': 75.8, 'source': 'Tide gauge'},
    {'year': 1950, 'sea_level_mm': 92.4, 'source': 'Tide gauge'},
    {'year': 1960, 'sea_level_mm': 108.6, 'source': 'Tide gauge'},
    {'year': 1970, 'sea_level_mm': 124.9, 'source': 'Tide gauge'},
    {'year': 1980, 'sea_level_mm': 142.1, 'source': 'Tide gauge'},
    {'year': 1990, 'sea_level_mm': 161.4, 'source': 'Tide gauge'},
    {'year': 1995, 'sea_level_mm': 174.2, 'source': 'Satellite altimetry'},
    {'year': 2000, 'sea_level_mm': 188.0, 'source': 'Satellite altimetry'},
    {'year': 2005, 'sea_level_mm': 202.5, 'source': 'Satellite altimetry'},
    {'year': 2010, 'sea_level_mm': 216.8, 'source': 'Satellite altimetry'},
    {'year': 2015, 'sea_level_mm': 232.1, 'source': 'Satellite altimetry'},
    {'year': 2020, 'sea_level_mm': 247.9, 'source': 'Satellite altimetry'},
    {'year': 2023, 'sea_level_mm': 258.4, 'source': 'Satellite altimetry'},
    {'year': 2024, 'sea_level_mm': 262.1, 'source': 'Satellite altimetry'}
]

# Arctic Sea Ice Minimum Extent (September average in Million km²)
# Source: National Snow and Ice Data Center (NSIDC)
arctic_ice_timeline = [
    {'year': 1979, 'extent_m_km2': 7.05},
    {'year': 1980, 'extent_m_km2': 7.67},
    {'year': 1985, 'extent_m_km2': 6.70},
    {'year': 1990, 'extent_m_km2': 6.14},
    {'year': 1995, 'extent_m_km2': 6.08},
    {'year': 2000, 'extent_m_km2': 6.25},
    {'year': 2005, 'extent_m_km2': 5.50},
    {'year': 2007, 'extent_m_km2': 4.27},
    {'year': 2010, 'extent_m_km2': 4.87},
    {'year': 2012, 'extent_m_km2': 3.57}, # Record low
    {'year': 2015, 'extent_m_km2': 4.62},
    {'year': 2018, 'extent_m_km2': 4.71},
    {'year': 2020, 'extent_m_km2': 3.92},
    {'year': 2021, 'extent_m_km2': 4.92},
    {'year': 2022, 'extent_m_km2': 4.87},
    {'year': 2023, 'extent_m_km2': 4.37},
    {'year': 2024, 'extent_m_km2': 4.28}
]

# IPCC 6th Assessment Report (AR6) Shared Socioeconomic Pathways (SSPs)
# Projections 2020 - 2100 for temperature anomaly (°C vs 1850-1900)
ipcc_scenarios = {
    'SSP1-1.9': {
        'name': 'Very Low (1.5°C Paris Ambition)',
        'description': 'Aggressive decarbonization, net-zero CO2 around 2050. Global warming peaks around 1.6°C and declines to ~1.4°C by 2100.',
        'color': '#10b981',
        'trajectory': [
            {'year': 2020, 'temp_anomaly': 1.15, 'sea_level_rise_cm': 25},
            {'year': 2030, 'temp_anomaly': 1.40, 'sea_level_rise_cm': 30},
            {'year': 2040, 'temp_anomaly': 1.55, 'sea_level_rise_cm': 35},
            {'year': 2050, 'temp_anomaly': 1.60, 'sea_level_rise_cm': 38},
            {'year': 2060, 'temp_anomaly': 1.55, 'sea_level_rise_cm': 41},
            {'year': 2070, 'temp_anomaly': 1.50, 'sea_level_rise_cm': 44},
            {'year': 2080, 'temp_anomaly': 1.45, 'sea_level_rise_cm': 46},
            {'year': 2090, 'temp_anomaly': 1.42, 'sea_level_rise_cm': 48},
            {'year': 2100, 'temp_anomaly': 1.40, 'sea_level_rise_cm': 50}
        ]
    },
    'SSP1-2.6': {
        'name': 'Low (Below 2.0°C Target)',
        'description': 'Substantial emissions cuts, net-zero CO2 around 2075. Warming stabilizes at ~1.8°C by 2100.',
        'color': '#3b82f6',
        'trajectory': [
            {'year': 2020, 'temp_anomaly': 1.15, 'sea_level_rise_cm': 25},
            {'year': 2030, 'temp_anomaly': 1.45, 'sea_level_rise_cm': 31},
            {'year': 2040, 'temp_anomaly': 1.65, 'sea_level_rise_cm': 37},
            {'year': 2050, 'temp_anomaly': 1.75, 'sea_level_rise_cm': 42},
            {'year': 2060, 'temp_anomaly': 1.80, 'sea_level_rise_cm': 46},
            {'year': 2070, 'temp_anomaly': 1.80, 'sea_level_rise_cm': 50},
            {'year': 2080, 'temp_anomaly': 1.80, 'sea_level_rise_cm': 53},
            {'year': 2090, 'temp_anomaly': 1.80, 'sea_level_rise_cm': 55},
            {'year': 2100, 'temp_anomaly': 1.80, 'sea_level_rise_cm': 58}
        ]
    },
    'SSP2-4.5': {
        'name': 'Intermediate (Current Policies / Middle Road)',
        'description': 'Emissions remain near current levels until 2050 before gradually declining. Warming reaches ~2.7°C by 2100.',
        'color': '#f59e0b',
        'trajectory': [
            {'year': 2020, 'temp_anomaly': 1.15, 'sea_level_rise_cm': 25},
            {'year': 2030, 'temp_anomaly': 1.50, 'sea_level_rise_cm': 32},
            {'year': 2040, 'temp_anomaly': 1.80, 'sea_level_rise_cm': 40},
            {'year': 2050, 'temp_anomaly': 2.05, 'sea_level_rise_cm': 48},
            {'year': 2060, 'temp_anomaly': 2.25, 'sea_level_rise_cm': 54},
            {'year': 2070, 'temp_anomaly': 2.45, 'sea_level_rise_cm': 61},
            {'year': 2080, 'temp_anomaly': 2.58, 'sea_level_rise_cm': 67},
            {'year': 2090, 'temp_anomaly': 2.65, 'sea_level_rise_cm': 72},
            {'year': 2100, 'temp_anomaly': 2.70, 'sea_level_rise_cm': 78}
        ]
    },
    'SSP3-7.0': {
        'name': 'High (Regional Rivalry / Fragmented)',
        'description': 'Nationalism, sluggish economic growth, weak climate policies. Warming reaches ~3.6°C by 2100 with extreme weather.',
        'color': '#ea580c',
        'trajectory': [
            {'year': 2020, 'temp_anomaly': 1.15, 'sea_level_rise_cm': 25},
            {'year': 2030, 'temp_anomaly': 1.55, 'sea_level_rise_cm': 33},
            {'year': 2040, 'temp_anomaly': 1.95, 'sea_level_rise_cm': 42},
            {'year': 2050, 'temp_anomaly': 2.35, 'sea_level_rise_cm': 52},
            {'year': 2060, 'temp_anomaly': 2.75, 'sea_level_rise_cm': 63},
            {'year': 2070, 'temp_anomaly': 3.10, 'sea_level_rise_cm': 73},
            {'year': 2080, 'temp_anomaly': 3.35, 'sea_level_rise_cm': 83},
            {'year': 2090, 'temp_anomaly': 3.52, 'sea_level_rise_cm': 91},
            {'year': 2100, 'temp_anomaly': 3.65, 'sea_level_rise_cm': 100}
        ]
    },
    'SSP5-8.5': {
        'name': 'Very High (Fossil-Fueled Growth / Worst Case)',
        'description': 'Intensive fossil fuel consumption triples emissions. Warming exceeds ~4.4°C by 2100, causing catastrophic tipping points.',
        'color': '#dc2626',
        'trajectory': [
            {'year': 2020, 'temp_anomaly': 1.15, 'sea_level_rise_cm': 25},
            {'year': 2030, 'temp_anomaly': 1.65, 'sea_level_rise_cm': 34},
            {'year': 2040, 'temp_anomaly': 2.15, 'sea_level_rise_cm': 45},
            {'year': 2050, 'temp_anomaly': 2.70, 'sea_level_rise_cm': 58},
            {'year': 2060, 'temp_anomaly': 3.25, 'sea_level_rise_cm': 72},
            {'year': 2070, 'temp_anomaly': 3.75, 'sea_level_rise_cm': 86},
            {'year': 2080, 'temp_anomaly': 4.10, 'sea_level_rise_cm': 98},
            {'year': 2090, 'temp_anomaly': 4.30, 'sea_level_rise_cm': 110},
            {'year': 2100, 'temp_anomaly': 4.45, 'sea_level_rise_cm': 122}
        ]
    }
}

# Carbon Budget calculation parameters (IPCC AR6)
# Remaining carbon budget from Jan 2020: ~500 Gt CO2 for 50% chance of 1.5°C
# Emissions 2020-2024 have consumed ~185 Gt CO2 -> ~315 Gt remaining as of 2024
carbon_budget = {
    'target_1_5c': {
        'budget_remaining_gt': 250, # as of mid-2024
        'years_left_at_current_rate': 6.2,
        'deadline_year': 2030,
        'probability': '50%'
    },
    'target_2_0c': {
        'budget_remaining_gt': 950,
        'years_left_at_current_rate': 24.3,
        'deadline_year': 2048,
        'probability': '67%'
    },
    'annual_emission_rate_gt': 39.0, # Gt CO2/year
    'per_second_emission_tonnes': 1238 # tonnes per second
}

env_data = {
    'sea_level_timeline': sea_level_timeline,
    'arctic_ice_timeline': arctic_ice_timeline,
    'ipcc_scenarios': ipcc_scenarios,
    'carbon_budget': carbon_budget
}

with open(os.path.join(DATA_DIR, 'environmental_indicators.json'), 'w', encoding='utf-8') as f:
    json.dump(env_data, f, indent=2)

print(f"  Saved environmental_indicators.json.")
print("Preprocessing pipeline completed successfully!")
