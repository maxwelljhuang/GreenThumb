#!/usr/bin/env python
"""
Configuration Manager
Manages configuration for the entire pipeline with environment-specific settings.
"""

import os
import json
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Environment(Enum):
    """Environment types."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TEST = "test"


@dataclass
class IngestionConfig:
    """Ingestion pipeline configuration."""
    chunk_size: int = 1000
    quality_threshold: float = 0.3
    enable_dedup: bool = True
    max_retries: int = 3
    timeout_seconds: int = 3600
    parallel_workers: int = 1
    
    # Validation rules
    max_file_size_mb: int = 1000
    allowed_extensions: List[str] = field(default_factory=lambda: ['.csv', '.tsv'])
    required_columns: List[str] = field(default_factory=lambda: [
        'merchant_product_id', 'product_name', 'search_price'
    ])
    
    # Performance tuning
    use_bulk_insert: bool = True
    batch_size: int = 5000
    memory_limit_mb: int = 500


@dataclass
class TransformationConfig:
    """DBT transformation configuration."""
    dbt_project_path: str = "dbt-project"
    target: str = "dev"
    threads: int = 4
    full_refresh_interval_days: int = 7
    
    # Model selection
    models_to_run: Optional[str] = None
    exclude_models: Optional[str] = None
    tags: Optional[List[str]] = None
    
    # Test configuration
    test_severity: str = "warn"
    store_failures: bool = True
    fail_on_test_failure: bool = False


@dataclass
class MonitoringConfig:
    """Monitoring configuration."""
    check_interval_minutes: int = 30
    
    # Alert thresholds
    min_quality_score: float = 0.5
    max_error_rate: float = 0.10
    min_success_rate: float = 0.80
    max_stale_percentage: float = 0.20
    max_duplicate_rate: float = 0.15
    
    # Alert channels
    enable_email_alerts: bool = False
    enable_slack_alerts: bool = False
    alert_recipients: List[str] = field(default_factory=list)
    
    # Retention
    metrics_retention_days: int = 90
    logs_retention_days: int = 30


@dataclass
class DatabaseConfig:
    """Database configuration."""
    host: str = "localhost"
    port: int = 5432
    database: str = "greenthumb_dev"
    username: str = "postgres"
    password: str = "postgres"
    
    # Connection pool
    pool_size: int = 20
    max_overflow: int = 10
    pool_timeout: int = 30
    
    # Performance
    statement_timeout_ms: int = 300000
    lock_timeout_ms: int = 10000
    
    @property
    def url(self) -> str:
        """Get database URL."""
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass
class SchedulingConfig:
    """Job scheduling configuration."""
    enable_scheduler: bool = True
    timezone: str = "UTC"
    
    # Cron expressions
    ingestion_schedule: str = "0 */6 * * *"  # Every 6 hours
    transformation_schedule: str = "0 */4 * * *"  # Every 4 hours
    monitoring_schedule: str = "*/30 * * * *"  # Every 30 minutes
    cleanup_schedule: str = "0 2 * * *"  # Daily at 2 AM
    
    # Concurrency
    max_parallel_jobs: int = 3
    job_timeout_minutes: int = 120


@dataclass
class PipelineConfig:
    """Complete pipeline configuration."""
    environment: Environment = Environment.DEVELOPMENT
    ingestion: IngestionConfig = field(default_factory=IngestionConfig)
    transformation: TransformationConfig = field(default_factory=TransformationConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    scheduling: SchedulingConfig = field(default_factory=SchedulingConfig)
    
    # Feature flags
    features: Dict[str, bool] = field(default_factory=lambda: {
        'auto_transform_after_ingestion': True,
        'auto_cleanup_stale_data': True,
        'enable_quality_checks': True,
        'enable_performance_monitoring': True,
        'enable_cost_tracking': False
    })


class ConfigurationManager:
    """
    Manages configuration loading and validation.
    Supports multiple configuration sources with precedence:
    1. Environment variables (highest)
    2. Configuration file
    3. Defaults (lowest)
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration manager.
        
        Args:
            config_path: Path to configuration file
        """
        self.config_path = config_path or self._find_config_file()
        self.config = self._load_config()
    
    def _find_config_file(self) -> Optional[str]:
        """Find configuration file in standard locations."""
        search_paths = [
            Path.cwd() / "config.yaml",
            Path.cwd() / "config.json",
            Path.home() / ".greenthumb" / "config.yaml",
            Path("/etc/greenthumb/config.yaml")
        ]
        
        for path in search_paths:
            if path.exists():
                logger.info(f"Found configuration file: {path}")
                return str(path)
        
        return None
    
    def _load_config(self) -> PipelineConfig:
        """Load configuration from all sources."""
        config = PipelineConfig()
        
        # Load from file if exists
        if self.config_path and Path(self.config_path).exists():
            file_config = self._load_file_config(self.config_path)
            config = self._merge_config(config, file_config)
        
        # Override with environment variables
        env_config = self._load_env_config()
        config = self._merge_config(config, env_config)
        
        # Set environment
        env_name = os.getenv('APP_ENV', 'development')
        config.environment = Environment(env_name.lower())
        
        # Apply environment-specific overrides
        config = self._apply_environment_overrides(config)
        
        # Validate configuration
        self._validate_config(config)
        
        return config
    
    def _load_file_config(self, path: str) -> Dict[str, Any]:
        """Load configuration from file."""
        file_path = Path(path)
        
        if file_path.suffix == '.yaml' or file_path.suffix == '.yml':
            with open(file_path, 'r') as f:
                return yaml.safe_load(f)
        elif file_path.suffix == '.json':
            with open(file_path, 'r') as f:
                return json.load(f)
        else:
            raise ValueError(f"Unsupported config file format: {file_path.suffix}")
    
    def _load_env_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables."""
        config = {}
        
        # Database configuration
        if os.getenv('DATABASE_URL'):
            from urllib.parse import urlparse
            parsed = urlparse(os.getenv('DATABASE_URL'))
            config['database'] = {
                'host': parsed.hostname,
                'port': parsed.port or 5432,
                'database': parsed.path[1:] if parsed.path else 'greenthumb_dev',
                'username': parsed.username,
                'password': parsed.password
            }
        else:
            config['database'] = {}
            if os.getenv('DB_HOST'):
                config['database']['host'] = os.getenv('DB_HOST')
            if os.getenv('DB_PORT'):
                config['database']['port'] = int(os.getenv('DB_PORT'))
            if os.getenv('DB_NAME'):
                config['database']['database'] = os.getenv('DB_NAME')
            if os.getenv('DB_USER'):
                config['database']['username'] = os.getenv('DB_USER')
            if os.getenv('DB_PASSWORD'):
                config['database']['password'] = os.getenv('DB_PASSWORD')
        
        # Ingestion configuration
        config['ingestion'] = {}
        if os.getenv('INGESTION_CHUNK_SIZE'):
            config['ingestion']['chunk_size'] = int(os.getenv('INGESTION_CHUNK_SIZE'))
        if os.getenv('QUALITY_THRESHOLD'):
            config['ingestion']['quality_threshold'] = float(os.getenv('QUALITY_THRESHOLD'))
        if os.getenv('ENABLE_DEDUP'):
            config['ingestion']['enable_dedup'] = os.getenv('ENABLE_DEDUP').lower() == 'true'
        
        # Monitoring configuration
        config['monitoring'] = {}
        if os.getenv('MONITORING_INTERVAL'):
            config['monitoring']['check_interval_minutes'] = int(os.getenv('MONITORING_INTERVAL'))
        
        return config
    
    def _merge_config(self, base: PipelineConfig, updates: Dict[str, Any]) -> PipelineConfig:
        """Merge configuration updates into base config."""
        config_dict = asdict(base)
        
        def deep_merge(d1, d2):
            for k, v in d2.items():
                if k in d1 and isinstance(d1[k], dict) and isinstance(v, dict):
                    deep_merge(d1[k], v)
                else:
                    d1[k] = v
        
        deep_merge(config_dict, updates)
        
        # Reconstruct dataclasses
        return PipelineConfig(
            environment=base.environment,
            ingestion=IngestionConfig(**config_dict.get('ingestion', {})),
            transformation=TransformationConfig(**config_dict.get('transformation', {})),
            monitoring=MonitoringConfig(**config_dict.get('monitoring', {})),
            database=DatabaseConfig(**config_dict.get('database', {})),
            scheduling=SchedulingConfig(**config_dict.get('scheduling', {})),
            features=config_dict.get('features', {})
        )
    
    def _apply_environment_overrides(self, config: PipelineConfig) -> PipelineConfig:
        """Apply environment-specific configuration overrides."""
        if config.environment == Environment.PRODUCTION:
            # Production overrides
            config.ingestion.max_retries = 5
            config.monitoring.check_interval_minutes = 15
            config.monitoring.enable_email_alerts = True
            config.database.pool_size = 50
            config.database.statement_timeout_ms = 600000
            
        elif config.environment == Environment.STAGING:
            # Staging overrides
            config.monitoring.check_interval_minutes = 30
            config.database.pool_size = 30
            
        elif config.environment == Environment.TEST:
            # Test overrides
            config.ingestion.chunk_size = 10
            config.database.pool_size = 5
            config.monitoring.check_interval_minutes = 1
        
        return config
    
    def _validate_config(self, config: PipelineConfig):
        """Validate configuration values."""
        errors = []
        
        # Validate ingestion config
        if config.ingestion.chunk_size <= 0:
            errors.append("chunk_size must be positive")
        if not 0 <= config.ingestion.quality_threshold <= 1:
            errors.append("quality_threshold must be between 0 and 1")
        
        # Validate monitoring config
        if config.monitoring.check_interval_minutes <= 0:
            errors.append("check_interval_minutes must be positive")
        if not 0 <= config.monitoring.min_success_rate <= 1:
            errors.append("min_success_rate must be between 0 and 1")
        
        # Validate database config
        if config.database.pool_size <= 0:
            errors.append("pool_size must be positive")
        
        if errors:
            raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
    
    def get_config(self) -> PipelineConfig:
        """Get the current configuration."""
        return self.config
    
    def save_config(self, path: Optional[str] = None):
        """
        Save configuration to file.
        
        Args:
            path: Output path (uses default if not provided)
        """
        path = path or self.config_path or "config.yaml"
        
        config_dict = asdict(self.config)
        config_dict['environment'] = self.config.environment.value
        
        if path.endswith('.yaml') or path.endswith('.yml'):
            with open(path, 'w') as f:
                yaml.dump(config_dict, f, default_flow_style=False, indent=2)
        else:
            with open(path, 'w') as f:
                json.dump(config_dict, f, indent=2)
        
        logger.info(f"Configuration saved to {path}")
    
    def reload(self):
        """Reload configuration from sources."""
        self.config = self._load_config()
        logger.info("Configuration reloaded")
    
    def get_feature(self, feature_name: str) -> bool:
        """
        Get feature flag value.
        
        Args:
            feature_name: Name of the feature
            
        Returns:
            Whether feature is enabled
        """
        return self.config.features.get(feature_name, False)


# Singleton instance
_config_manager: Optional[ConfigurationManager] = None


def get_config_manager() -> ConfigurationManager:
    """Get or create the singleton configuration manager."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    return _config_manager


def get_config() -> PipelineConfig:
    """Get the current configuration."""
    return get_config_manager().get_config()


def main():
    """Configuration management CLI."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Configuration Management')
    parser.add_argument('--show', action='store_true', help='Show current configuration')
    parser.add_argument('--save', help='Save configuration to file')
    parser.add_argument('--validate', action='store_true', help='Validate configuration')
    parser.add_argument('--env', choices=['development', 'staging', 'production', 'test'],
                       help='Set environment')
    
    args = parser.parse_args()
    
    manager = get_config_manager()
    
    if args.env:
        os.environ['APP_ENV'] = args.env
        manager.reload()
        print(f"Environment set to: {args.env}")
    
    if args.validate:
        try:
            config = manager.get_config()
            print("Configuration is valid")
        except Exception as e:
            print(f"Configuration validation failed: {str(e)}")
            sys.exit(1)
    
    if args.show:
        config = manager.get_config()
        print(yaml.dump(asdict(config), default_flow_style=False, indent=2))
    
    if args.save:
        manager.save_config(args.save)
        print(f"Configuration saved to {args.save}")


if __name__ == '__main__':
    import sys
    main()