from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.database import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    role: str # "admin" or "employee"
    username: str # for admin this is "Admin", for employee this is phone_number
    password: str

class LoginResponse(BaseModel):
    success: bool
    role: str
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    message: str

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    if payload.role == "admin":
        from app.routers.settings import _get_setting
        admin_username = _get_setting("admin_username", "admin")
        admin_password = _get_setting("admin_password", "Arul@20")
        
        # We allow case insensitive check for admin_username if they use the default, 
        # but exact match for custom to be safe, or just stick to case-insensitive.
        if payload.username.lower() == admin_username.lower() and payload.password == admin_password:
            return LoginResponse(
                success=True,
                role="admin",
                message="Admin logged in successfully"
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
            
    elif payload.role == "employee":
        # Check employee by phone number
        result = (
            supabase.table("employees")
            .select("*")
            .eq("phone_number", payload.username)
            .execute()
        )
        
        employees = result.data
        if not employees:
            raise HTTPException(status_code=401, detail="Employee not found with this phone number")
            
        employee = employees[0]
        # In a real app we should hash passwords. Here we check plain text as requested.
        if employee.get("password") != payload.password:
            raise HTTPException(status_code=401, detail="Incorrect password")
            
        return LoginResponse(
            success=True,
            role="employee",
            employee_id=employee["employee_id"],
            employee_name=employee["name"],
            message="Employee logged in successfully"
        )
        
    raise HTTPException(status_code=400, detail="Invalid role specified")
