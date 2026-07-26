# Weighbridge Sale App - Backend (FastAPI + Supabase)

Backend for a weighbridge billing system with Employee and Admin modules.

## 1. Setup

### a) Create Supabase tables
Open your Supabase project -> SQL Editor -> paste and run `supabase_schema.sql`.
This creates the `employees`, `billing`, and `expenses` tables.

### b) Configure environment
```bash
cp .env.example .env
```
Fill in `SUPABASE_URL` and `SUPABASE_KEY` from **Project Settings -> API**.
Use the **service_role** key (not the anon/public key) — this backend runs
server-side and needs full read/write access; never expose this key to the
employee/admin frontend app.

### c) Install & run
```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs: `http://localhost:8000/docs`

## 2. Module -> Endpoint map

### Employee Billing Module
- `POST /billing/` — submit a new lorry entry (vehicle number, customer
  name/number, amount, payment_mode: gpay/cash/credit, employee_id/name)
- `GET /billing/` — most recent entries (convenience)

### Employee Expense Module
- `POST /expenses/` — log an expense (reason, amount, employee_id/name)
- `GET /expenses/` — most recent expenses

### Employee Management (Admin)
- `POST /employees/` — create employee (id auto-generated)
- `GET /employees/` — list all (populate Update/Delete dropdown)
- `GET /employees/{employee_id}` — fetch one
- `PUT /employees/{employee_id}` — update selected fields
- `DELETE /employees/{employee_id}` — delete

### Sale Module
- `GET /sales/today` — all of today's sales
- `GET /sales/?start_date=&end_date=&payment_mode=` — flexible filtering
  (single day, date range, and/or gpay/cash/credit category — combinable)
- `GET /sales/download?start_date=&end_date=&payment_mode=` — CSV export

### Admin Dashboard
- `GET /admin/dashboard` — returns:
  - `total_orders_today`, `total_sale_today`
  - breakdown per payment mode (`gpay`, `cash`, `credit`): count + amount
  - `total_expense_today`
  - `opening_balance` = today's **cash** sales − today's expenses
    (e.g. total sale 5000, cash portion 1000, expenses 400 → opening
    balance = 1000 − 400 = 600)
  - `yesterday_total_sale` and `sale_change_vs_yesterday_pct`
  - `average_week_sale` (trailing 7 days) and `average_month_sale`
    (month-to-date average per day)

## 3. Auto-delete (31-day retention)

`app/scheduler.py` starts a background job (APScheduler) when the API
boots. It runs once a day and deletes any `billing` / `expenses` row where
`created_at` is older than `RECORD_RETENTION_DAYS` (default 31).

Example: a row saved on **Jan 21** is deleted once the system date passes
**Feb 21** (31 days later) — matching the rule you described (Jan 20 entry
auto-deletes around Feb 20).

Notes:
- This requires the FastAPI process to be running (a long-lived server,
  e.g. deployed on Render/Railway/EC2/VPS — not a serverless function that
  sleeps). Adjust `AUTO_DELETE_HOUR` / `AUTO_DELETE_MINUTE` in `.env`.
- If you'd rather this run entirely inside the database (independent of
  the API server's uptime), an equivalent `pg_cron` version is included
  as a commented block at the bottom of `supabase_schema.sql` — enable the
  `pg_cron` extension in Supabase and uncomment it.
- `employees` are **not** auto-deleted, only `billing` and `expenses`.

## 4. Data integrity notes

- `created_at` is stamped by Postgres (`now()`), so date & time are always
  accurate and server-controlled — not sent from the client.
- `payment_mode` is DB-constrained to only `gpay`, `cash`, or `credit`.
- The employee's billing/expense screens should first call
  `GET /employees/` to know the logged-in employee's `employee_id` /
  `name` to attach to each entry.

## 5. Project structure
```
weighbridge_backend/
├── main.py                # FastAPI app, CORS, router wiring, scheduler startup
├── supabase_schema.sql    # Run once in Supabase SQL editor
├── requirements.txt
├── .env.example
└── app/
    ├── config.py           # env var loading
    ├── database.py         # Supabase client
    ├── schemas.py          # Pydantic request/response models
    ├── helpers.py          # shared date-range / aggregation helpers
    ├── scheduler.py        # daily auto-delete job
    └── routers/
        ├── employee.py     # Employee CRUD
        ├── billing.py      # Billing (sale) entry
        ├── expense.py      # Expense entry
        ├── sales.py        # Sale Module: view/filter/download
        └── admin.py        # Admin dashboard stats
```
