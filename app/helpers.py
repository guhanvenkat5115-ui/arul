from datetime import date, datetime, timedelta, time
from typing import Optional, List, Dict

from app.database import supabase


import zoneinfo

# We define the local timezone (IST)
LOCAL_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")

def day_bounds(d: date):
    """Return (start_iso, end_iso) covering the full 24h of date d in local timezone,
    converted to UTC ISO strings suitable for Supabase gte/lt timestamp filters."""
    # Create start and end datetime in local timezone
    start_local = datetime.combine(d, time.min).replace(tzinfo=LOCAL_TZ)
    end_local = start_local + timedelta(days=1)
    
    # Convert them to UTC before making isoformat, so Supabase compares UTC properly
    start_utc = start_local.astimezone(zoneinfo.ZoneInfo("UTC"))
    end_utc = end_local.astimezone(zoneinfo.ZoneInfo("UTC"))
    
    return start_utc.isoformat(), end_utc.isoformat()


def fetch_billing_between(start_iso: str, end_iso: str) -> List[Dict]:
    result = (
        supabase.table("billing")
        .select("*")
        .gte("created_at", start_iso)
        .lt("created_at", end_iso)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def fetch_expenses_between(start_iso: str, end_iso: str) -> List[Dict]:
    result = (
        supabase.table("expenses")
        .select("*")
        .gte("created_at", start_iso)
        .lt("created_at", end_iso)
        .execute()
    )
    return result.data or []


def sum_amount(rows: List[Dict]) -> float:
    return round(sum(float(r.get("amount", 0) or 0) for r in rows), 2)


def breakdown_by_payment_mode(rows: List[Dict]) -> Dict[str, Dict[str, float]]:
    modes = {"gpay": {"count": 0, "amount": 0.0},
             "cash": {"count": 0, "amount": 0.0},
             "credit": {"count": 0, "amount": 0.0}}
    for r in rows:
        mode = r.get("payment_mode")
        if mode in modes:
            modes[mode]["count"] += 1
            modes[mode]["amount"] += float(r.get("amount", 0) or 0)
    for m in modes:
        modes[m]["amount"] = round(modes[m]["amount"], 2)
    return modes
