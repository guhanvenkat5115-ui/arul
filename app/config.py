import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

RECORD_RETENTION_DAYS = int(os.getenv("RECORD_RETENTION_DAYS", "31"))
AUTO_DELETE_HOUR = int(os.getenv("AUTO_DELETE_HOUR", "0"))
AUTO_DELETE_MINUTE = int(os.getenv("AUTO_DELETE_MINUTE", "30"))

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_KEY must be set (copy .env.example to .env and fill them in)."
    )
