"""
Interactive Climate Change Dashboard - Application Server
=========================================================
A robust Python web server providing REST APIs and serving the interactive
Climate Change Dashboard frontend.

Usage:
    python app.py [--port 8000] [--host 127.0.0.1]
"""

import os
import sys
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')
DATA_DIR = os.path.join(STATIC_DIR, 'data')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')

# Preload data cache for instant API responses
data_cache = {}

def load_data():
    files = {
        'global_climate': os.path.join(DATA_DIR, 'global_climate.json'),
        'cities_summary': os.path.join(DATA_DIR, 'cities_summary.json'),
        'countries_summary': os.path.join(DATA_DIR, 'countries_summary.json'),
        'emissions_ghg': os.path.join(DATA_DIR, 'emissions_ghg.json'),
        'environmental_indicators': os.path.join(DATA_DIR, 'environmental_indicators.json'),
        'eda_metrics': os.path.join(DATA_DIR, 'eda_metrics.json'),
    }
    for key, path in files.items():
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data_cache[key] = json.load(f)
        else:
            data_cache[key] = None
    print(f"Loaded {len([k for k, v in data_cache.items() if v is not None])} data models into server memory.")

load_data()

class ClimateDashboardHandler(SimpleHTTPRequestHandler):
    """Custom request handler with REST API routing and static file delivery."""
    
    def log_message(self, format, *args):
        # Clean terminal logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def end_headers(self):
        # Enable CORS and caching headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # ----------------------------------------------------------------------
        # REST API ROUTING
        # ----------------------------------------------------------------------
        if path.startswith('/api/'):
            self.handle_api(path, query)
            return

        # ----------------------------------------------------------------------
        # ROOT ROUTING (Serve index.html)
        # ----------------------------------------------------------------------
        if path == '/' or path == '/index.html':
            index_path = os.path.join(TEMPLATES_DIR, 'index.html')
            if not os.path.exists(index_path):
                # Fallback to root or static if index.html is there
                index_path = os.path.join(BASE_DIR, 'index.html')
            if os.path.exists(index_path):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                with open(index_path, 'rb') as f:
                    content = f.read()
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return
            else:
                self.send_error(404, "index.html template not found")
                return

        # ----------------------------------------------------------------------
        # STATIC ASSETS
        # ----------------------------------------------------------------------
        if path.startswith('/static/'):
            # Strip '/static/' prefix and map to STATIC_DIR
            relative = path[len('/static/'):].lstrip('/')
            file_path = os.path.join(STATIC_DIR, relative)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                self.serve_file(file_path)
                return

        # Fallback to standard handler for any other relative files
        return super().do_GET()

    def handle_api(self, path, query):
        """Dispatches REST API endpoints and returns JSON responses."""
        try:
            if path == '/api/status':
                res = {
                    'status': 'online',
                    'service': 'Interactive Climate Change Dashboard API',
                    'version': '2.0.0',
                    'datasets_loaded': list(data_cache.keys()),
                    'total_countries': len(data_cache.get('countries_summary') or []),
                    'total_cities': len(data_cache.get('cities_summary') or [])
                }
                self.send_json(res)
                return

            if path == '/api/global-trends':
                self.send_json(data_cache.get('global_climate') or {})
                return

            if path == '/api/emissions':
                self.send_json(data_cache.get('emissions_ghg') or {})
                return

            if path == '/api/indicators':
                self.send_json(data_cache.get('environmental_indicators') or {})
                return

            if path == '/api/eda':
                self.send_json(data_cache.get('eda_metrics') or {})
                return

            if path == '/api/cities':
                cities = data_cache.get('cities_summary') or []
                # Optional query params: search, continent/country, sort
                search = query.get('q', [''])[0].strip().lower()
                if search:
                    cities = [c for c in cities if search in c['city'].lower() or search in c['country'].lower()]
                self.send_json(cities)
                return

            if path.startswith('/api/city/'):
                city_name = urllib.parse.unquote(path[len('/api/city/'):]).strip()
                cities = data_cache.get('cities_summary') or []
                match = next((c for c in cities if c['city'].lower() == city_name.lower()), None)
                if match:
                    self.send_json(match)
                else:
                    self.send_json({'error': f"City '{city_name}' not found"}, 404)
                return

            if path == '/api/countries':
                countries = data_cache.get('countries_summary') or []
                search = query.get('q', [''])[0].strip().lower()
                if search:
                    countries = [c for c in countries if search in c['country'].lower()]
                # Optional compact mode (omit timeline if just listing names & metrics)
                compact = query.get('compact', ['false'])[0].lower() == 'true'
                if compact:
                    compact_list = [{
                        'country': c['country'],
                        'baseline_temp': c['baseline_temp'],
                        'recent_temp': c['recent_temp'],
                        'warming_delta': c['warming_delta']
                    } for c in countries]
                    self.send_json(compact_list)
                else:
                    self.send_json(countries)
                return

            if path.startswith('/api/country/'):
                country_name = urllib.parse.unquote(path[len('/api/country/'):]).strip()
                countries = data_cache.get('countries_summary') or []
                match = next((c for c in countries if c['country'].lower() == country_name.lower()), None)
                if match:
                    self.send_json(match)
                else:
                    self.send_json({'error': f"Country '{country_name}' not found"}, 404)
                return

            if path == '/api/projections':
                # Dynamic Climate Projection Simulator calculation
                # Params: peak_year (default 2030), reduction_rate (%/year, default 3.0),
                # climate_sensitivity (°C per doubling CO2, default 3.0)
                try:
                    peak_year = int(query.get('peak_year', [2030])[0])
                    reduction_rate = float(query.get('reduction_rate', [3.0])[0])
                except (ValueError, IndexError):
                    peak_year = 2030
                    reduction_rate = 3.0

                result = self.simulate_climate_trajectory(peak_year, reduction_rate)
                self.send_json(result)
                return

            self.send_json({'error': 'Endpoint not found', 'path': path}, 404)

        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def simulate_climate_trajectory(self, peak_year, reduction_rate_pct):
        """Simulates custom anthropogenic emissions, cumulative CO2, temperature rise, and sea level."""
        current_year = 2024
        current_emissions = 39.0 # Gt CO2 / year
        current_anomaly = 1.28  # °C vs 1850-1900
        current_sea_level = 262.0 # mm

        trajectory = []
        cum_co2_from_2024 = 0.0
        emiss = current_emissions
        t_anomaly = current_anomaly
        sea_level = current_sea_level

        for y in range(2024, 2101):
            if y <= peak_year:
                # Slight growth before peak (+0.8%/year)
                emiss = emiss * 1.008
            else:
                # Annual reduction
                decay = 1.0 - (reduction_rate_pct / 100.0)
                emiss = max(0.0, emiss * decay)

            cum_co2_from_2024 += emiss
            
            # Transient Climate Response to Cumulative Carbon Emissions (TCRE):
            # ~0.45°C per 1,000 Gt CO2 emitted (IPCC standard)
            delta_t = (cum_co2_from_2024 / 1000.0) * 0.45
            proj_temp = round(current_anomaly + delta_t, 2)
            
            # Sea level rise response: thermal expansion + melt (~3.5 mm/year + acceleration)
            sea_level += 3.5 + (delta_t * 2.0)

            if y % 5 == 0 or y == 2100 or y == 2024:
                trajectory.append({
                    'year': y,
                    'annual_emissions_gt': round(emiss, 2),
                    'cumulative_co2_gt': round(cum_co2_from_2024, 1),
                    'projected_temp_anomaly': round(proj_temp, 2),
                    'projected_sea_level_mm': round(sea_level, 1),
                    'projected_sea_level_cm': round(sea_level / 10.0, 1)
                })

        return {
            'parameters': {
                'peak_year': peak_year,
                'reduction_rate_pct': reduction_rate_pct,
            },
            'summary': {
                'warming_by_2100_deg_c': trajectory[-1]['projected_temp_anomaly'],
                'sea_level_rise_by_2100_cm': trajectory[-1]['projected_sea_level_cm'],
                'paris_1_5c_compatible': trajectory[-1]['projected_temp_anomaly'] <= 1.6,
                'paris_2_0c_compatible': trajectory[-1]['projected_temp_anomaly'] <= 2.0
            },
            'trajectory': trajectory
        }

    def serve_file(self, file_path):
        """Serves a static file with appropriate content-type."""
        ext = os.path.splitext(file_path)[1].lower()
        content_types = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        }
        ct = content_types.get(ext, 'application/octet-stream')

        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', ct)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run_server(port=8000, host='127.0.0.1'):
    server_address = (host, port)
    httpd = HTTPServer(server_address, ClimateDashboardHandler)
    print("\n" + "="*60)
    print("🌍 INTERACTIVE CLIMATE CHANGE DASHBOARD")
    print("="*60)
    print(f"Server running at: http://{host}:{port}/")
    print(f"API endpoints live at: http://{host}:{port}/api/status")
    print("Press Ctrl+C to stop the server.")
    print("="*60 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server gracefully...")
        httpd.server_close()
        print("Server stopped.")

if __name__ == '__main__':
    port = 8000
    host = '127.0.0.1'
    if len(sys.argv) > 1:
        for i, arg in enumerate(sys.argv):
            if arg == '--port' and i + 1 < len(sys.argv):
                port = int(sys.argv[i + 1])
            elif arg == '--host' and i + 1 < len(sys.argv):
                host = sys.argv[i + 1]
    run_server(port, host)
