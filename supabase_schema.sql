-- ============================================================
-- Weighbridge Billing System - Supabase Schema
-- Run this in Supabase SQL Editor (Project -> SQL Editor -> New query)
-- ============================================================

-- 1. EMPLOYEES TABLE
create table if not exists employees (
    employee_id   bigint generated always as identity primary key,
    name          text not null,
    phone_number  text not null,
    address       text,
    created_at    timestamptz not null default now()
);

-- 2. BILLING TABLE (Weighbridge sale entries)
create table if not exists billing (
    id               bigint generated always as identity primary key,
    vehicle_number   text not null,
    customer_name    text not null,
    customer_number  text,
    amount           numeric(12,2) not null default 0,   -- weighbridge charge amount
    payment_mode     text not null check (payment_mode in ('gpay','cash','credit')),
    employee_id      bigint references employees(employee_id) on delete set null,
    employee_name    text not null,
    created_at       timestamptz not null default now()
);

create index if not exists idx_billing_created_at on billing (created_at);
create index if not exists idx_billing_payment_mode on billing (payment_mode);

-- 3. EXPENSES TABLE
create table if not exists expenses (
    id             bigint generated always as identity primary key,
    reason         text not null,
    amount         numeric(12,2) not null,
    employee_id    bigint references employees(employee_id) on delete set null,
    employee_name  text not null,
    created_at     timestamptz not null default now()
);

create index if not exists idx_expenses_created_at on expenses (created_at);

-- ============================================================
-- AUTO-DELETE (31 days retention) - OPTIONAL DB-LEVEL APPROACH
-- ============================================================
-- The FastAPI backend already runs a daily background job that deletes
-- billing/expense rows older than 31 days (see app/scheduler.py).
--
-- If you prefer the deletion to happen inside Supabase itself (works even
-- if the FastAPI server is offline), enable the pg_cron extension and run
-- the block below instead/also. This requires pg_cron to be enabled in
-- Database -> Extensions on Supabase.
--
-- create extension if not exists pg_cron;
--
-- select cron.schedule(
--   'auto-delete-old-billing',
--   '30 0 * * *',  -- every day at 00:30
--   $$ delete from billing where created_at < now() - interval '31 days' $$
-- );
--
-- select cron.schedule(
--   'auto-delete-old-expenses',
--   '35 0 * * *',
--   $$ delete from expenses where created_at < now() - interval '31 days' $$
-- );
