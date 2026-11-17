@echo off
title Interactive Climate Change Dashboard
echo ======================================================================
echo           INTERACTIVE CLIMATE CHANGE DASHBOARD
echo ======================================================================
echo.
echo [1/2] Checking preprocessed climate data assets...
if not exist "static\data\global_climate.json" (
    echo Preprocessed data not found. Running data pipeline...
    python preprocess_data.py
    python eda_analysis.py
) else (
    echo Data assets verified.
)

echo.
echo [2/2] Starting Climate Dashboard Web Server on http://127.0.0.1:8000 ...
echo Opening your default browser...
start http://127.0.0.1:8000/
python app.py --port 8000
pause
