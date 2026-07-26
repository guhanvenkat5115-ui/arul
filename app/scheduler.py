import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import supabase
from app.config import RECORD_RETENTION_DAYS, AUTO_DELETE_HOUR, AUTO_DELETE_MINUTE

logger = logging.getLogger("auto_delete")
logging.basicConfig(level=logging.INFO)


def auto_delete_old_records():
    """
    Deletes billing and expense rows older than RECORD_RETENTION_DAYS
    (default 31). Example: a row saved on Jan 21 gets deleted once the
    system date passes Feb 21 (31 days later).
    """
    cutoff = datetime.utcnow() - timedelta(days=RECORD_RETENTION_DAYS)
    cutoff_iso = cutoff.isoformat()

    try:
        billing_result = (
            supabase.table("billing").delete().lt("created_at", cutoff_iso).execute()
        )
        deleted_billing = len(billing_result.data or [])

        expense_result = (
            supabase.table("expenses").delete().lt("created_at", cutoff_iso).execute()
        )
        deleted_expenses = len(expense_result.data or [])

        logger.info(
            "Auto-delete run complete. Removed %s billing rows and %s expense rows older than %s.",
            deleted_billing, deleted_expenses, cutoff_iso,
        )
    except Exception as exc:  # keep the scheduler alive even if one run fails
        logger.error("Auto-delete job failed: %s", exc)


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        auto_delete_old_records,
        trigger="cron",
        hour=AUTO_DELETE_HOUR,
        minute=AUTO_DELETE_MINUTE,
        id="auto_delete_old_records",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Auto-delete scheduler started - runs daily at %02d:%02d UTC, retention=%s days.",
        AUTO_DELETE_HOUR, AUTO_DELETE_MINUTE, RECORD_RETENTION_DAYS,
    )
    return scheduler
