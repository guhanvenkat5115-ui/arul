from fastapi import APIRouter, HTTPException
from typing import List

from app.database import supabase
from app.schemas import BillingCreate, BillingOut

router = APIRouter(prefix="/billing", tags=["Billing Module"])


@router.post("/", response_model=BillingOut)
def create_billing_entry(payload: BillingCreate):
    """Employee submits a new lorry billing entry.
    created_at (date + time) is stamped automatically by the DB (now())."""
    result = supabase.table("billing").insert(payload.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to save billing entry")
    return result.data[0]


@router.get("/", response_model=List[BillingOut])
def list_recent_billing(limit: int = 50):
    """Convenience endpoint: most recent billing entries."""
    result = (
        supabase.table("billing")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data
