import csv
import io
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.database import supabase
from app.helpers import day_bounds
from app.schemas import BillingOut

router = APIRouter(prefix="/sales", tags=["Sale Module"])


def _build_query(
    start_date: Optional[date],
    end_date: Optional[date],
    payment_mode: Optional[str],
):
    query = supabase.table("billing").select("*")

    if start_date:
        start_iso, _ = day_bounds(start_date)
        query = query.gte("created_at", start_iso)
    if end_date:
        _, end_iso = day_bounds(end_date)
        query = query.lt("created_at", end_iso)
    if payment_mode:
        if payment_mode not in ("gpay", "cash", "credit"):
            raise HTTPException(status_code=400, detail="Invalid payment_mode")
        query = query.eq("payment_mode", payment_mode)

    return query.order("created_at", desc=True)


@router.get("/today", response_model=List[BillingOut])
def sales_today():
    """All sale entries recorded today."""
    start_iso, end_iso = day_bounds(date.today())
    result = (
        supabase.table("billing")
        .select("*")
        .gte("created_at", start_iso)
        .lt("created_at", end_iso)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/", response_model=List[BillingOut])
def sales_filtered(
    start_date: Optional[date] = Query(None, description="Filter: from this date (inclusive)"),
    end_date: Optional[date] = Query(None, description="Filter: up to this date (inclusive)"),
    payment_mode: Optional[str] = Query(None, description="gpay | cash | credit"),
):
    """
    Flexible sales lookup:
    - single day: pass start_date == end_date (or just start_date)
    - date range: pass both start_date and end_date
    - category filter: pass payment_mode = gpay / cash / credit
    All params are optional and combine together.
    """
    query = _build_query(start_date, end_date, payment_mode)
    result = query.execute()
    return result.data


@router.get("/download")
def download_sales_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    payment_mode: Optional[str] = Query(None),
):
    """Download filtered sales report as CSV."""
    query = _build_query(start_date, end_date, payment_mode)
    rows = query.execute().data or []

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "ID", "Vehicle Number", "Customer Name", "Customer Number",
        "Amount", "Payment Mode", "Employee ID", "Employee Name", "Date & Time"
    ])
    for r in rows:
        writer.writerow([
            r.get("id"), r.get("vehicle_number"), r.get("customer_name"),
            r.get("customer_number"), r.get("amount"), r.get("payment_mode"),
            r.get("employee_id"), r.get("employee_name"), r.get("created_at"),
        ])

    buffer.seek(0)
    filename = f"sales_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
