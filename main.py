from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.scheduler import start_scheduler
from app.routers import billing, expense, employee, sales, admin, auth, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: kick off the daily auto-delete background job
    scheduler = start_scheduler()
    yield
    # Shutdown
    scheduler.shutdown()


app = FastAPI(
    title="Weighbridge Sale App - Backend",
    description="FastAPI + Supabase backend for weighbridge billing, expenses, "
                 "employee management, sales reporting and admin dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

@app.exception_handler(APIError)
async def supabase_api_error_handler(request: Request, exc: APIError):
    code = getattr(exc, "code", None)
    message = getattr(exc, "message", str(exc))
    
    if code == "PGRST205":
        if "public." in message:
            table_name = message.split("public.")[-1].split("'")[0]
            # This dynamically uses the table name that caused the error
            detail_msg = f"Database configuration error: The table '{table_name}' does not exist in your Supabase project."
            return JSONResponse(status_code=500, content={"detail": detail_msg})
        return JSONResponse(status_code=500, content={"detail": "Requested database table not found."})
        
    return JSONResponse(status_code=400, content={"detail": message})

# Allow the employee/admin frontend (web or mobile) to call this API.
# Restrict allow_origins to your actual app domain(s) in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employee.router)
app.include_router(billing.router)
app.include_router(expense.router)
app.include_router(sales.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(settings.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "weighbridge-backend"}
