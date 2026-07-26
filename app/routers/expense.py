from fastapi import APIRouter, HTTPException
from typing import List

from app.database import supabase
from app.schemas import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/expenses", tags=["Expense Module"])


@router.post("/", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate):
    """Employee logs an expense (reason + amount). employee_id / name are
    sent along so admin can see who recorded it."""
    result = supabase.table("expenses").insert(payload.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to save expense")
    return result.data[0]


@router.get("/", response_model=List[ExpenseOut])
def list_recent_expenses(limit: int = 50):
    result = (
        supabase.table("expenses")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data
