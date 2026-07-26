/*
# Weighbridge Sale Management Schema

1. New Tables
- `employees`: stores employee details (custom employee_id, name, phone, address).
- `sales`: stores each weighbridge billing record (vehicle number, customer details, payment mode, amount) along with the employee who created it. Amounts are in Rupees.
- `expenses`: stores expense entries (reason, amount) along with the employee who recorded it. Amounts are in Rupees.
2. Auto-delete
- Enables pg_cron extension and schedules a daily job that deletes sales and expenses rows older than 31 days (a record added on Jan 20 is removed on Feb 20).
3. Security
- RLS enabled on all tables. This is a no-auth single-tenant app, so anon + authenticated are allowed full CRUD (data is intentionally shared on the device).
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL,
  customer_name text NOT NULL,
  customer_number text,
  payment_mode text NOT NULL CHECK (payment_mode IN ('gpay', 'cash', 'credit')),
  amount numeric NOT NULL DEFAULT 0,
  employee_id text,
  employee_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  employee_id text,
  employee_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales (created_at);
CREATE INDEX IF NOT EXISTS sales_payment_mode_idx ON sales (payment_mode);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON expenses (created_at);
CREATE INDEX IF NOT EXISTS employees_employee_id_idx ON employees (employee_id);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_sales" ON sales;
CREATE POLICY "anon_select_sales" ON sales FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sales" ON sales;
CREATE POLICY "anon_insert_sales" ON sales FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sales" ON sales;
CREATE POLICY "anon_update_sales" ON sales FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sales" ON sales;
CREATE POLICY "anon_delete_sales" ON sales FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE
  TO anon, authenticated USING (true);

-- Auto-delete: enable pg_cron and schedule a daily cleanup of records older than 31 days
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weighbridge_auto_delete') THEN
    PERFORM cron.unschedule('weighbridge_auto_delete');
  END IF;
END $$;

DO $$
BEGIN
  PERFORM cron.schedule(
    'weighbridge_auto_delete',
    '0 1 * * *',
    $cleanup$DELETE FROM sales WHERE created_at < now() - interval '31 days'; DELETE FROM expenses WHERE created_at < now() - interval '31 days';$cleanup$
  );
END $$;
