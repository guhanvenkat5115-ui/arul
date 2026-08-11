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

def _set_setting(key: str, value: str):
    result = supabase.table("settings").select("id").eq("key", key).execute()
    if result.data:
        supabase.table("settings").update({"value": value, "updated_at": datetime.utcnow().isoformat()}).eq("key", key).execute()
    else:
        supabase.table("settings").insert({"key": key, "value": value}).execute()

@router.get("/", response_model=SettingsOut)
def get_settings():
    """Fetch current system settings (e.g. taxes, admin credentials)"""
    taxes_str = _get_setting("taxes", "[]")
    try:
        taxes_list = json.loads(taxes_str)
        taxes = [TaxItem(**t) for t in taxes_list]
    except Exception:
        taxes = []
        
    admin_username = _get_setting("admin_username", "admin")
    admin_password = _get_setting("admin_password", "Arul@20")

    return SettingsOut(
        taxes=taxes, 
        admin_username=admin_username, 
        admin_password=admin_password
    )

@router.put("/", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate):
    """Update system settings (Admin only)"""
    val = json.dumps([t.model_dump() for t in payload.taxes])
    _set_setting("taxes", val)
    
    if payload.admin_username is not None:
        _set_setting("admin_username", payload.admin_username)
    if payload.admin_password is not None:
        _set_setting("admin_password", payload.admin_password)
        
    return SettingsOut(
        taxes=payload.taxes,
        admin_username=payload.admin_username or _get_setting("admin_username", "admin"),
        admin_password=payload.admin_password or _get_setting("admin_password", "Arul@20")
    )
