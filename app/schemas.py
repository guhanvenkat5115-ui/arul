from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

PaymentMode = Literal["gpay", "cash", "credit"]


# ---------------------- EMPLOYEE ----------------------
class EmployeeCreate(BaseModel):
    name: str
    phone_number: str
    address: Optional[str] = None
    password: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None


class EmployeeOut(BaseModel):
    employee_id: int
    name: str
    phone_number: str
    address: Optional[str] = None
    created_at: datetime


# ---------------------- BILLING (SALE) ----------------------
class BillingCreate(BaseModel):
    vehicle_number: str
    customer_name: str
    customer_number: Optional[str] = None
    amount: float = Field(..., gt=0, description="Weighbridge charge amount for this entry")
    payment_mode: PaymentMode
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None


class BillingOut(BaseModel):
    id: int
    vehicle_number: str
    customer_name: str
    customer_number: Optional[str] = None
    amount: float
    payment_mode: PaymentMode
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    created_at: datetime


# ---------------------- EXPENSE ----------------------
class ExpenseCreate(BaseModel):
    reason: str
    amount: float = Field(..., gt=0)
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None


class ExpenseOut(BaseModel):
    id: int
    reason: str
    amount: float
    employee_id: Optional[int] = None
    employee_name: str
    created_at: datetime


# ---------------------- ADMIN DASHBOARD ----------------------
class PaymentModeBreakdown(BaseModel):
    count: int
    amount: float


class DashboardResponse(BaseModel):
    date: date
    total_orders_today: int
    total_sale_today: float
    gpay: PaymentModeBreakdown
    cash: PaymentModeBreakdown
    credit: PaymentModeBreakdown
    total_expense_today: float
    opening_balance: float

    yesterday_total_sale: float
    sale_change_vs_yesterday_pct: Optional[float]

    average_week_sale: float
    average_month_sale: float


# ---------------------- SETTINGS ----------------------
class TaxItem(BaseModel):
    id: str
    name: str
    percentage: float

class SettingsUpdate(BaseModel):
    taxes: list[TaxItem]

class SettingsOut(BaseModel):
    taxes: list[TaxItem]
