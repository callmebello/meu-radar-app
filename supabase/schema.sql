-- Priva — database schema. Run in the Supabase SQL editor.

-- Users table
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  cpf_hash text,
  plan text default 'free',
  is_paid boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Scans cache table (avoids re-calling APIs)
create table if not exists scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  cpf_hash text not null,
  email text,
  result jsonb not null,
  breach_count integer default 0,
  risk_level text default 'ALTO',
  created_at timestamp default now(),
  expires_at timestamp default (now() + interval '30 days')
);

-- one cached scan per user (saveScan upserts on user_id)
create unique index if not exists scans_user_id_key on scans (user_id);

-- Subscriptions table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  plan text not null,
  status text default 'active',
  mp_subscription_id text,
  amount numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- API usage counter (monthly budget guard for paid APIs like SerpAPI)
create table if not exists api_usage (
  id uuid default gen_random_uuid() primary key,
  api_name text not null,
  month text not null,
  count integer default 0,
  unique (api_name, month)
);

-- Alerts table
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  type text not null,
  title text not null,
  description text,
  read boolean default false,
  created_at timestamp default now()
);
