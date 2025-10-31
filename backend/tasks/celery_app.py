"""
Celery Application Configuration
"""

import os
from celery import Celery

# Get configuration from environment
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Create Celery app
app = Celery(
    'greenthumb',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        'backend.tasks.ingestion',
        'backend.tasks.embeddings',
    ]
)

# Celery configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Optional: Configure periodic tasks with Celery Beat
app.conf.beat_schedule = {
    # Example: Run cleanup task daily
    # 'cleanup-expired-data': {
    #     'task': 'backend.tasks.maintenance.cleanup_expired_data',
    #     'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    # },
}

if __name__ == '__main__':
    app.start()
