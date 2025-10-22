#!/usr/bin/env python3
"""
Automated Setup Script for GreenThumb Discovery Pipeline
Initializes the complete environment including database, dependencies, and configurations.
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path
import logging
import json
import psycopg2
from psycopg2 import sql
import urllib.parse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


class SetupManager:
    """Manages the complete setup process for the pipeline."""
    
    def __init__(self):
        """Initialize setup manager."""
        self.os_type = platform.system()
        self.python_version = sys.version_info
        self.project_root = Path.cwd()
        self.errors = []
        self.warnings = []
        
    def print_header(self):
        """Print setup header."""
        print(f"\n{Colors.HEADER}{'=' * 60}{Colors.ENDC}")
        print(f"{Colors.BOLD}🌱 GreenThumb Discovery Pipeline - Automated Setup{Colors.ENDC}")
        print(f"{Colors.HEADER}{'=' * 60}{Colors.ENDC}\n")
        
    def check_system_requirements(self):
        """Check system requirements."""
        print(f"{Colors.CYAN}📋 Checking System Requirements...{Colors.ENDC}")
        
        # Check Python version
        if self.python_version.major == 3 and self.python_version.minor >= 8:
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Python {sys.version.split()[0]} (>= 3.8 required)")
        else:
            print(f"  {Colors.RED}✗{Colors.ENDC} Python {sys.version.split()[0]} (>= 3.8 required)")
            self.errors.append("Python 3.8 or higher is required")
        
        # Check for required commands
        commands = {
            'pip': 'Python package manager',
            'psql': 'PostgreSQL client',
            'git': 'Version control'
        }
        
        for cmd, description in commands.items():
            if shutil.which(cmd):
                print(f"  {Colors.GREEN}✓{Colors.ENDC} {description} ({cmd})")
            else:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  {description} ({cmd}) not found")
                self.warnings.append(f"{cmd} not found - {description}")
        
        # Check for optional commands
        optional_commands = {
            'make': 'Build automation',
            'docker': 'Container runtime',
            'dbt': 'Data transformation'
        }
        
        for cmd, description in optional_commands.items():
            if shutil.which(cmd):
                print(f"  {Colors.GREEN}✓{Colors.ENDC} {description} ({cmd}) [optional]")
            else:
                print(f"  {Colors.BLUE}ℹ{Colors.ENDC}  {description} ({cmd}) not found [optional]")
    
    def create_directories(self):
        """Create required directory structure."""
        print(f"\n{Colors.CYAN}📁 Creating Directory Structure...{Colors.ENDC}")
        
        directories = [
            'backend/ingestion',
            'backend/api',
            'backend/models',
            'backend/utils',
            'scripts/automation',
            'scripts/monitoring',
            'scripts/database',
            'scripts/maintenance',
            'database/migrations',
            'database/backups',
            'logs/application',
            'logs/ingestion',
            'logs/transformation',
            'logs/monitoring',
            'logs/automation',
            'logs/error',
            'reports',
            'data/raw',
            'data/processed',
            'config',
            '.env.d'
        ]
        
        for directory in directories:
            dir_path = self.project_root / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Created {directory}")
    
    def setup_virtual_environment(self):
        """Set up Python virtual environment."""
        print(f"\n{Colors.CYAN}🐍 Setting Up Virtual Environment...{Colors.ENDC}")
        
        venv_path = self.project_root / 'venv'
        
        if venv_path.exists():
            print(f"  {Colors.YELLOW}ℹ{Colors.ENDC}  Virtual environment already exists")
        else:
            try:
                subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Created virtual environment")
            except subprocess.CalledProcessError as e:
                self.errors.append(f"Failed to create virtual environment: {e}")
                print(f"  {Colors.RED}✗{Colors.ENDC} Failed to create virtual environment")
                return False
        
        # Determine pip path based on OS
        if self.os_type == 'Windows':
            pip_path = venv_path / 'Scripts' / 'pip.exe'
            activation_cmd = f"venv\\Scripts\\activate"
        else:
            pip_path = venv_path / 'bin' / 'pip'
            activation_cmd = f"source venv/bin/activate"
        
        print(f"  {Colors.BLUE}ℹ{Colors.ENDC}  Activate with: {activation_cmd}")
        
        return str(pip_path)
    
    def install_python_dependencies(self, pip_path=None):
        """Install Python dependencies."""
        print(f"\n{Colors.CYAN}📦 Installing Python Dependencies...{Colors.ENDC}")
        
        pip_cmd = pip_path or 'pip'
        
        # Upgrade pip first
        try:
            subprocess.run([pip_cmd, 'install', '--upgrade', 'pip'], 
                         check=True, capture_output=True)
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Upgraded pip")
        except subprocess.CalledProcessError:
            print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  Could not upgrade pip")
        
        # Core dependencies
        core_deps = [
            'psycopg2-binary',
            'sqlalchemy',
            'pandas',
            'numpy',
            'pydantic',
            'python-dotenv',
            'click',
            'tqdm',
            'pyyaml'
        ]
        
        # Install core dependencies
        for dep in core_deps:
            try:
                subprocess.run([pip_cmd, 'install', dep], 
                             check=True, capture_output=True)
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Installed {dep}")
            except subprocess.CalledProcessError:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  Failed to install {dep}")
                self.warnings.append(f"Failed to install {dep}")
        
        # Install from requirements.txt if it exists
        req_file = self.project_root / 'requirements.txt'
        if req_file.exists():
            try:
                subprocess.run([pip_cmd, 'install', '-r', 'requirements.txt'], 
                             check=True, capture_output=True)
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Installed from requirements.txt")
            except subprocess.CalledProcessError:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  Some requirements failed to install")
    
    def setup_database(self):
        """Set up PostgreSQL database with pgvector."""
        print(f"\n{Colors.CYAN}🗄️  Setting Up PostgreSQL Database...{Colors.ENDC}")
        
        # Get database configuration
        db_url = os.getenv('DATABASE_URL', 
                          'postgresql://postgres:postgres@localhost:5432/greenthumb_dev')
        
        # Parse database URL
        parsed = urllib.parse.urlparse(db_url)
        db_config = {
            'host': parsed.hostname or 'localhost',
            'port': parsed.port or 5432,
            'user': parsed.username or 'postgres',
            'password': parsed.password or 'postgres',
            'database': parsed.path[1:] if parsed.path else 'greenthumb_dev'
        }
        
        print(f"  Database: {db_config['database']} @ {db_config['host']}:{db_config['port']}")
        
        try:
            # Connect to PostgreSQL (connect to postgres database first)
            conn = psycopg2.connect(
                host=db_config['host'],
                port=db_config['port'],
                user=db_config['user'],
                password=db_config['password'],
                database='postgres'
            )
            conn.autocommit = True
            cur = conn.cursor()
            
            # Check if database exists
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_config['database'],)
            )
            
            if not cur.fetchone():
                # Create database
                cur.execute(sql.SQL("CREATE DATABASE {}").format(
                    sql.Identifier(db_config['database'])
                ))
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Created database '{db_config['database']}'")
            else:
                print(f"  {Colors.BLUE}ℹ{Colors.ENDC}  Database '{db_config['database']}' already exists")
            
            cur.close()
            conn.close()
            
            # Connect to the new database
            conn = psycopg2.connect(
                host=db_config['host'],
                port=db_config['port'],
                user=db_config['user'],
                password=db_config['password'],
                database=db_config['database']
            )
            conn.autocommit = True
            cur = conn.cursor()
            
            # Install pgvector extension
            try:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Installed pgvector extension")
            except psycopg2.Error as e:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  pgvector extension not available: {e}")
                self.warnings.append("pgvector extension not available")
            
            # Create additional extensions
            extensions = ['uuid-ossp', 'pg_trgm', 'btree_gin', 'btree_gist']
            for ext in extensions:
                try:
                    cur.execute(f"CREATE EXTENSION IF NOT EXISTS \"{ext}\"")
                    print(f"  {Colors.GREEN}✓{Colors.ENDC} Installed {ext} extension")
                except psycopg2.Error:
                    print(f"  {Colors.YELLOW}ℹ{Colors.ENDC}  {ext} extension not available")
            
            # Create schemas
            schemas = ['staging', 'marts', 'analytics', 'test_results']
            for schema in schemas:
                cur.execute(sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(
                    sql.Identifier(schema)
                ))
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Created schema '{schema}'")
            
            cur.close()
            conn.close()
            
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Database setup complete")
            return True
            
        except psycopg2.Error as e:
            self.errors.append(f"Database setup failed: {e}")
            print(f"  {Colors.RED}✗{Colors.ENDC} Database setup failed: {e}")
            return False
    
    def initialize_database_tables(self):
        """Initialize database tables using init_db.py."""
        print(f"\n{Colors.CYAN}📊 Initializing Database Tables...{Colors.ENDC}")
        
        init_script = self.project_root / 'scripts' / 'maintenance' / 'init_db.py'
        
        if init_script.exists():
            try:
                subprocess.run([sys.executable, str(init_script)], 
                             check=True, capture_output=True)
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Database tables initialized")
            except subprocess.CalledProcessError as e:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  Failed to initialize tables: {e}")
                self.warnings.append("Failed to initialize database tables")
        else:
            print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  init_db.py not found")
    
    def install_dbt(self, pip_path=None):
        """Install and configure DBT."""
        print(f"\n{Colors.CYAN}🔧 Installing DBT...{Colors.ENDC}")
        
        pip_cmd = pip_path or 'pip'
        
        try:
            subprocess.run([pip_cmd, 'install', 'dbt-postgres'], 
                         check=True, capture_output=True)
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Installed dbt-postgres")
            
            # Initialize DBT project if needed
            dbt_project = self.project_root / 'dbt-project' / 'dbt_project.yml'
            if dbt_project.exists():
                print(f"  {Colors.BLUE}ℹ{Colors.ENDC}  DBT project already configured")
            else:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  DBT project not configured")
                
        except subprocess.CalledProcessError:
            print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  Failed to install DBT")
            self.warnings.append("Failed to install DBT")
    
    def create_env_file(self):
        """Create .env file with default configuration."""
        print(f"\n{Colors.CYAN}⚙️  Creating Configuration Files...{Colors.ENDC}")
        
        env_file = self.project_root / '.env'
        
        if env_file.exists():
            print(f"  {Colors.BLUE}ℹ{Colors.ENDC}  .env file already exists")
        else:
            env_content = """# GreenThumb Discovery Pipeline Configuration

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenthumb_dev
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# Ingestion Configuration
INGESTION_CHUNK_SIZE=1000
QUALITY_THRESHOLD=0.3
ENABLE_DEDUP=true
MAX_RETRIES=3

# Monitoring Configuration
MONITORING_INTERVAL=30
MIN_QUALITY_SCORE=0.5
MIN_SUCCESS_RATE=0.8

# Application Configuration
APP_ENV=development
LOG_LEVEL=INFO

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# DBT Configuration
DBT_PROFILES_DIR=~/.dbt
DBT_PROJECT_DIR=./dbt-project
"""
            env_file.write_text(env_content)
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Created .env file")
        
        # Create config.yaml
        config_file = self.project_root / 'config' / 'config.yaml'
        if not config_file.exists():
            config_content = """# Pipeline Configuration
environment: development

ingestion:
  chunk_size: 1000
  quality_threshold: 0.3
  enable_dedup: true
  max_retries: 3
  parallel_workers: 1

transformation:
  dbt_project_path: dbt-project
  full_refresh_interval_days: 7
  threads: 4

monitoring:
  check_interval_minutes: 30
  alert_thresholds:
    min_quality_score: 0.5
    max_error_rate: 0.1
    min_success_rate: 0.8

database:
  pool_size: 20
  max_overflow: 10
  statement_timeout_ms: 300000
"""
            config_file.write_text(config_content)
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Created config.yaml")
    
    def setup_git_hooks(self):
        """Set up Git hooks for code quality."""
        print(f"\n{Colors.CYAN}🔗 Setting Up Git Hooks...{Colors.ENDC}")
        
        git_dir = self.project_root / '.git'
        if not git_dir.exists():
            print(f"  {Colors.YELLOW}ℹ{Colors.ENDC}  Not a Git repository, skipping hooks")
            return
        
        # Pre-commit hook
        pre_commit = git_dir / 'hooks' / 'pre-commit'
        pre_commit_content = """#!/bin/sh
# Pre-commit hook for code quality

echo "Running pre-commit checks..."

# Format check
black --check backend scripts

# Lint check
flake8 backend scripts --max-line-length=100

# Type check
mypy backend --ignore-missing-imports

if [ $? -ne 0 ]; then
    echo "Pre-commit checks failed. Please fix the issues and try again."
    exit 1
fi

echo "Pre-commit checks passed!"
"""
        pre_commit.write_text(pre_commit_content)
        pre_commit.chmod(0o755)
        print(f"  {Colors.GREEN}✓{Colors.ENDC} Created pre-commit hook")
    
    def test_setup(self):
        """Test the setup to ensure everything works."""
        print(f"\n{Colors.CYAN}🧪 Testing Setup...{Colors.ENDC}")
        
        # Test database connection
        try:
            import psycopg2
            db_url = os.getenv('DATABASE_URL', 
                              'postgresql://postgres:postgres@localhost:5432/greenthumb_dev')
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            cur.execute("SELECT version()")
            version = cur.fetchone()[0]
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Database connection: {version[:30]}...")
            cur.close()
            conn.close()
        except Exception as e:
            print(f"  {Colors.RED}✗{Colors.ENDC} Database connection failed: {e}")
            self.errors.append("Database connection test failed")
        
        # Test Python imports
        test_imports = [
            ('pandas', 'Data processing'),
            ('psycopg2', 'Database driver'),
            ('sqlalchemy', 'ORM'),
            ('pydantic', 'Data validation')
        ]
        
        for module, description in test_imports:
            try:
                __import__(module)
                print(f"  {Colors.GREEN}✓{Colors.ENDC} {description} ({module})")
            except ImportError:
                print(f"  {Colors.RED}✗{Colors.ENDC} {description} ({module}) not available")
                self.errors.append(f"{module} import failed")
        
        # Test script accessibility
        scripts = [
            'scripts/greenthumb_cli.py',
            'scripts/automation/orchestrator.py',
            'scripts/maintenance/init_db.py'
        ]
        
        for script in scripts:
            script_path = self.project_root / script
            if script_path.exists():
                print(f"  {Colors.GREEN}✓{Colors.ENDC} Script found: {script}")
            else:
                print(f"  {Colors.YELLOW}⚠{Colors.ENDC}  Script missing: {script}")
    
    def print_summary(self):
        """Print setup summary."""
        print(f"\n{Colors.HEADER}{'=' * 60}{Colors.ENDC}")
        print(f"{Colors.BOLD}📋 Setup Summary{Colors.ENDC}")
        print(f"{Colors.HEADER}{'=' * 60}{Colors.ENDC}\n")
        
        if self.errors:
            print(f"{Colors.RED}❌ Errors ({len(self.errors)}):{Colors.ENDC}")
            for error in self.errors:
                print(f"  • {error}")
            print()
        
        if self.warnings:
            print(f"{Colors.YELLOW}⚠️  Warnings ({len(self.warnings)}):{Colors.ENDC}")
            for warning in self.warnings:
                print(f"  • {warning}")
            print()
        
        if not self.errors:
            print(f"{Colors.GREEN}✅ Setup completed successfully!{Colors.ENDC}\n")
            print(f"{Colors.BOLD}Next Steps:{Colors.ENDC}")
            print(f"  1. Activate virtual environment:")
            if self.os_type == 'Windows':
                print(f"     {Colors.CYAN}venv\\Scripts\\activate{Colors.ENDC}")
            else:
                print(f"     {Colors.CYAN}source venv/bin/activate{Colors.ENDC}")
            print(f"  2. Initialize database tables:")
            print(f"     {Colors.CYAN}python scripts/maintenance/init_db.py{Colors.ENDC}")
            print(f"  3. Run a test ingestion:")
            print(f"     {Colors.CYAN}make ingest FILE=sample.csv MERCHANT_ID=1001{Colors.ENDC}")
            print(f"  4. Monitor the pipeline:")
            print(f"     {Colors.CYAN}make monitor{Colors.ENDC}")
        else:
            print(f"{Colors.RED}⚠️  Setup completed with errors. Please fix the issues above.{Colors.ENDC}")
    
    def run(self):
        """Run the complete setup process."""
        self.print_header()
        
        # Run setup steps
        self.check_system_requirements()
        self.create_directories()
        
        pip_path = self.setup_virtual_environment()
        if pip_path:
            self.install_python_dependencies(pip_path)
            self.install_dbt(pip_path)
        
        self.create_env_file()
        self.setup_database()
        self.initialize_database_tables()
        self.setup_git_hooks()
        self.test_setup()
        
        # Print summary
        self.print_summary()
        
        return len(self.errors) == 0


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Automated setup for GreenThumb Discovery Pipeline'
    )
    parser.add_argument(
        '--skip-venv',
        action='store_true',
        help='Skip virtual environment creation'
    )
    parser.add_argument(
        '--skip-db',
        action='store_true',
        help='Skip database setup'
    )
    parser.add_argument(
        '--skip-deps',
        action='store_true',
        help='Skip dependency installation'
    )
    
    args = parser.parse_args()
    
    # Run setup
    setup = SetupManager()
    success = setup.run()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()