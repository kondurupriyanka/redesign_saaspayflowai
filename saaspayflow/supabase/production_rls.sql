-- =========================================================
-- PAYFLOW AI - PRODUCTION RLS SECURITY POLICIES
-- =========================================================
-- Target: production-ready security for full SaaS launch.
-- Rules: 
-- 1. No data access without authentication.
-- 2. Users can only see/manage their own data (user_id match).
-- 3. Strict schema isolation.
-- =========================================================

-- Enable RLS on all core tables
alter table users enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;
alter table analytics_events enable row level security;
alter table subscriptions enable row level security;

-- USERS TABLE POLICIES
drop policy if exists "Users can read own record" on users;
create policy "Users can read own record" on users 
  for select using (auth.uid() = id);

drop policy if exists "Users can update own record" on users;
create policy "Users can update own record" on users 
  for update using (auth.uid() = id);

-- CLIENTS TABLE POLICIES
drop policy if exists "Users can manage own clients" on clients;
create policy "Users can manage own clients" on clients 
  for all using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- INVOICES TABLE POLICIES
drop policy if exists "Users can manage own invoices" on invoices;
create policy "Users can manage own invoices" on invoices 
  for all using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- PAYMENTS TABLE POLICIES
drop policy if exists "Users can manage own payments" on payments;
create policy "Users can manage own payments" on payments 
  for all using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- NOTIFICATIONS TABLE POLICIES
drop policy if exists "Users can manage own notifications" on notifications;
create policy "Users can manage own notifications" on notifications 
  for all using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- ANALYTICS_EVENTS TABLE POLICIES
drop policy if exists "Users can manage own analytics" on analytics_events;
create policy "Users can manage own analytics" on analytics_events 
  for all using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- SUBSCRIPTIONS TABLE POLICIES
drop policy if exists "Users can read own subscription" on subscriptions;
create policy "Users can read own subscription" on subscriptions 
  for select using (user_id = auth.uid());

-- =========================================================
-- VERIFICATION QUERIES (Optional)
-- =========================================================
-- select * from pg_policies where schemaname = 'public';
