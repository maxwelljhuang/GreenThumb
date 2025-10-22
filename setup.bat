@echo off
REM GreenThumb Discovery Pipeline - Windows Setup Script

echo ================================================
echo   GreenThumb Discovery Pipeline - Quick Setup
echo ================================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found

REM Check PostgreSQL
echo Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL client not found
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
) else (
    echo [OK] PostgreSQL found
)

REM Create virtual environment
echo.
echo Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [INFO] Virtual environment already exists
)

REM Activate virtual environment
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated

REM Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
echo [OK] pip upgraded

REM Install dependencies
echo.
echo Installing Python dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt >nul 2>&1
    echo [OK] Dependencies installed from requirements.txt
) else (
    pip install psycopg2-binary sqlalchemy pandas numpy pydantic >nul 2>&1
    pip install python-dotenv click tqdm pyyaml tabulate >nul 2>&1
    echo [OK] Core dependencies installed
)

REM Create directory structure
echo.
echo Creating directory structure...

mkdir backend\ingestion 2>nul
mkdir backend\api 2>nul
mkdir backend\models 2>nul
mkdir backend\utils 2>nul
mkdir scripts\automation 2>nul
mkdir scripts\monitoring 2>nul
mkdir scripts\database 2>nul
mkdir scripts\maintenance 2>nul
mkdir database\migrations 2>nul
mkdir database\backups 2>nul
mkdir logs\application 2>nul
mkdir logs\ingestion 2>nul
mkdir logs\transformation 2>nul
mkdir logs\monitoring 2>nul
mkdir logs\automation 2>nul
mkdir logs\error 2>nul
mkdir reports 2>nul
mkdir data\raw 2>nul
mkdir data\processed 2>nul
mkdir config 2>nul

echo [OK] Directory structure created

REM Create .env file
echo.
echo Creating configuration files...
if not exist ".env" (
    (
    echo # GreenThumb Discovery Pipeline Configuration
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenthumb_dev
    echo DB_POOL_SIZE=20
    echo DB_MAX_OVERFLOW=10
    echo.
    echo INGESTION_CHUNK_SIZE=1000
    echo QUALITY_THRESHOLD=0.3
    echo ENABLE_DEDUP=true
    echo MAX_RETRIES=3
    echo.
    echo MONITORING_INTERVAL=30
    echo MIN_QUALITY_SCORE=0.5
    echo MIN_SUCCESS_RATE=0.8
    echo.
    echo APP_ENV=development
    echo LOG_LEVEL=INFO
    ) > .env
    echo [OK] .env file created
) else (
    echo [INFO] .env file already exists
)

REM Database setup instructions
echo.
echo ================================================
echo Database Setup Required
echo ================================================
echo.
echo Please complete the following PostgreSQL setup:
echo.
echo 1. Open pgAdmin or psql
echo 2. Create database:
echo    CREATE DATABASE greenthumb_dev;
echo.
echo 3. Install extensions:
echo    \c greenthumb_dev
echo    CREATE EXTENSION IF NOT EXISTS vector;
echo    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
echo    CREATE EXTENSION IF NOT EXISTS pg_trgm;
echo.
echo 4. Create schemas:
echo    CREATE SCHEMA IF NOT EXISTS staging;
echo    CREATE SCHEMA IF NOT EXISTS marts;
echo    CREATE SCHEMA IF NOT EXISTS analytics;
echo.

REM Initialize tables
echo.
echo Initializing database tables...
if exist "scripts\maintenance\init_db.py" (
    python scripts\maintenance\init_db.py 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Database tables initialized
    ) else (
        echo [WARNING] Could not initialize tables. Please run manually:
        echo python scripts\maintenance\init_db.py
    )
) else (
    echo [WARNING] init_db.py not found
)

REM Install DBT
echo.
echo Installing DBT...
pip install dbt-postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] DBT installed
) else (
    echo [INFO] DBT installation skipped
)

REM Verification
echo.
echo Running verification...
if exist "scripts\verify_system.py" (
    python scripts\verify_system.py
)

REM Summary
echo.
echo ================================================
echo          Setup Completed!
echo ================================================
echo.
echo Next steps:
echo.
echo 1. Ensure PostgreSQL is running
echo.
echo 2. Complete database setup (see instructions above)
echo.
echo 3. Test database connection:
echo    python scripts\database\connection_manager.py --test
echo.
echo 4. Run your first ingestion:
echo    python scripts\greenthumb_cli.py ingest csv sample.csv --merchant-id 1001
echo.
echo 5. Monitor the pipeline:
echo    python scripts\greenthumb_cli.py monitor quality
echo.
echo For detailed instructions, see SETUP.md
echo.
pause