"""Celery application configuration"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("govproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# ── Periodic Beat Schedule ────────────────────────────────────────────────────
# MoSPI publishes Flash Reports monthly.
# We attempt auto-download on the 1st of each month at 6am IST.
# Schedule conservatively — do NOT poll more than monthly.
app.conf.beat_schedule = {
    "sync-paimana-monthly": {
        "task": "apps.ingestion.tasks.sync_paimana_flash_report",
        "schedule": crontab(hour=6, minute=0, day_of_month=1),
        "kwargs": {"auto_download": True},
        "options": {"expires": 3600},  # Expire if not picked up within 1 hour
    },
}
app.conf.timezone = "Asia/Kolkata"
