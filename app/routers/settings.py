from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas import SettingsUpdate, SettingsOut, TaxItem
from datetime import datetime
import json

router = APIRouter(prefix="/settings", tags=["Settings"])

def _get_setting(key: str, default: str) -> str:
    result = supabase.table("settings").select("value").eq("key", key).execute()
    if not result.data:
        return default
    return result.data[0]["value"]

@router.get("/", response_model=SettingsOut)
def get_settings():
    """Fetch current system settings (e.g. taxes)"""
    taxes_str = _get_setting("taxes", "[]")
    try:
        taxes_list = json.loads(taxes_str)
        # Parse into Pydantic models to ensure validation
        taxes = [TaxItem(**t) for t in taxes_list]
    except Exception:
        taxes = []
        
    return SettingsOut(taxes=taxes)

@router.put("/", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate):
    """Update system settings (Admin only)"""
    # Upsert taxes
    result = supabase.table("settings").select("id").eq("key", "taxes").execute()
    
    val = json.dumps([t.model_dump() for t in payload.taxes])
    if result.data:
        # Update
        supabase.table("settings").update({"value": val, "updated_at": datetime.utcnow().isoformat()}).eq("key", "taxes").execute()
    else:
        # Insert
        supabase.table("settings").insert({"key": "taxes", "value": val}).execute()
        
    return SettingsOut(taxes=payload.taxes)
