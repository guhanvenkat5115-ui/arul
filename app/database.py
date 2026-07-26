from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY

# Single shared Supabase client (uses the service role key -> full DB access
# from the trusted backend server only. Never ship the service role key to
# the frontend / mobile app).
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
