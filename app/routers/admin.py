from datetime import date, timedelta

from fastapi import APIRouter

from app.helpers import (
    day_bounds,
    fetch_billing_between,
    fetch_expenses_between,
    sum_amount,
    breakdown_by_payment_mode,
)
from app.schemas import DashboardResponse, PaymentModeBreakdown

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard():
    today = date.today()
    yesterday = today - timedelta(days=1)

    # ---------- Today ----------
    start_iso, end_iso = day_bounds(today)
    today_rows = fetch_billing_between(start_iso, end_iso)
    today_expenses = fetch_expenses_between(start_iso, end_iso)

    total_orders_today = len(today_rows)
    total_sale_today = sum_amount(today_rows)
    total_expense_today = sum_amount(today_expenses)
    breakdown = breakdown_by_payment_mode(today_rows)

    # Opening balance = today's CASH sales - today's expenses
    # e.g. total sale 5000, cash portion 1000, expenses 400 -> 1000 - 400 = 600
    opening_balance = round(breakdown["cash"]["amount"] - total_expense_today, 2)

    # ---------- Yesterday comparison ----------
    y_start_iso, y_end_iso = day_bounds(yesterday)
    yesterday_rows = fetch_billing_between(y_start_iso, y_end_iso)
    yesterday_total_sale = sum_amount(yesterday_rows)

    if yesterday_total_sale > 0:
        change_pct = round(
            ((total_sale_today - yesterday_total_sale) / yesterday_total_sale) * 100, 2
        )
    else:
        change_pct = None  # avoid divide-by-zero; frontend can show "N/A"

    # ---------- Weekly average (trailing 7 days including today) ----------
    week_start = today - timedelta(days=6)
    w_start_iso, _ = day_bounds(week_start)
    week_rows = fetch_billing_between(w_start_iso, end_iso)
    average_week_sale = round(sum_amount(week_rows) / 7, 2)

    # ---------- Monthly average (month-to-date, divided by elapsed days) ----------
    month_start = today.replace(day=1)
    m_start_iso, _ = day_bounds(month_start)
    month_rows = fetch_billing_between(m_start_iso, end_iso)
    days_elapsed = (today - month_start).days + 1
    average_month_sale = round(sum_amount(month_rows) / days_elapsed, 2)

    return DashboardResponse(
        date=today,
        total_orders_today=total_orders_today,
        total_sale_today=total_sale_today,
        gpay=PaymentModeBreakdown(**breakdown["gpay"]),
        cash=PaymentModeBreakdown(**breakdown["cash"]),
        credit=PaymentModeBreakdown(**breakdown["credit"]),
        total_expense_today=total_expense_today,
        opening_balance=opening_balance,
        yesterday_total_sale=yesterday_total_sale,
        sale_change_vs_yesterday_pct=change_pct,
        average_week_sale=average_week_sale,
        average_month_sale=average_month_sale,
    )
