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

-- LGPD removal authorizations (Proteção Total). Formal record that the user
-- authorized Priva to send data-removal requests on their behalf (Art. 18, LGPD).
create table if not exists lgpd_authorizations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  full_name text not null,
  cpf_hash text not null,
  authorized_at timestamp default now(),
  ip_address text
);

-- Proteção Total (R$24,90) removal cases — one per authorized request.
create table if not exists removal_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  case_id text unique not null,
  full_name text not null,
  cpf text not null,
  phone text not null,
  birth_date text not null,
  address text,
  confirmed_data jsonb,
  sources_to_remove jsonb,
  authorization_text text not null,
  status text default 'pending', -- pending | sent | waiting | resolved | escalated
  created_at timestamp default now(),
  updated_at timestamp default now()
);
create index if not exists removal_requests_user_idx on removal_requests(user_id);
create index if not exists removal_requests_status_idx on removal_requests(status);

-- Storage buckets used by the PDF generators are created on first use by the
-- server functions (admin.storage.createBucket). They are PRIVATE; the app
-- serves time-limited signed URLs (7 days):
--   'relatorios'   -> {userId}/relatorio.pdf   (plano Essencial)
--   'cartas-lgpd'  -> {userId}/carta-lgpd.pdf  (plano Proteção Total)

-- Lead profile: the pre-scan quiz answers joined to the user, the hashed
-- identity and the scan outcome. This is what powers segmented e-mail and
-- remarketing ("said their passwords are exposed", "never checked before").
-- Written best-effort by syncLeadProfile — the funnel works without it.
create table if not exists quiz_answers (
  email text primary key,
  user_id uuid references users(id) on delete set null,
  cpf_hash text,
  q1 text,
  q2 text[] default '{}',
  q3 text,
  breach_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quiz_answers_user_id_idx on quiz_answers(user_id);

-- ---------------------------------------------------------------------------
-- Abuse + cost control for the paid scan APIs (HIBP, SerpAPI).
--
-- The tools in Atividade cost nothing (they run on the device), but a scan
-- spends real credits. Without this, one script could burn the whole month's
-- SerpAPI allowance for every user at once.
--
-- The subject is a SALTED HASH of the client IP, never the IP. It is only ever
-- compared against itself, and the daily rows are disposable — see the cleanup
-- note at the bottom.
create table if not exists rate_limits (
  bucket text not null,
  subject text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (bucket, subject, day)
);
create index if not exists rate_limits_day_idx on rate_limits(day);

-- Atomic increment. Read-then-write would let concurrent scans slip past the
-- limit; this returns the count AFTER the call, in one statement.
create or replace function bump_rate_limit(p_bucket text, p_subject text)
returns int language plpgsql as $$
declare c int;
begin
  insert into rate_limits (bucket, subject, day, count)
  values (p_bucket, p_subject, current_date, 1)
  on conflict (bucket, subject, day)
  do update set count = rate_limits.count + 1
  returning count into c;
  return c;
end $$;

-- Response cache. The key is a salted hash of the query (CPF, phone, e-mail),
-- so what someone searched for is never stored in the clear. Re-scanning the
-- same identity is the most common repeat call by far — legitimately (people
-- check again) and abusively — and each cache hit costs zero credits.
create table if not exists api_cache (
  cache_key text primary key,
  kind text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists api_cache_created_idx on api_cache(created_at);

-- Housekeeping (optional, via pg_cron or by hand):
--   delete from rate_limits where day < current_date - 7;
--   delete from api_cache  where created_at < now() - interval '30 days';

-- ---------------------------------------------------------------------------
-- Attribution: which narrative actually sold Priva.
--
-- TikTok reports views and Stripe reports revenue; nothing joins them unless
-- the origin is carried from the click to the sale. Written by saveUser at
-- scan time, when the e-mail first exists.
--
-- first_* is written ONCE and never overwritten: someone who sees the UGC
-- video, comes back three days later by typing the domain, and buys — that
-- sale belongs to the video, not to the direct visit. last_* is the footnote.
--
-- Link convention (utm_content is the asset id from the asset bank):
--   ?utm_source=tiktok_creator_01&utm_medium=organic
--   &utm_campaign=cpf_exposto&utm_content=042
alter table users add column if not exists first_source text;
alter table users add column if not exists first_medium text;
alter table users add column if not exists first_campaign text;
alter table users add column if not exists first_content text;
alter table users add column if not exists first_referrer text;
alter table users add column if not exists first_landing text;
alter table users add column if not exists first_seen_at timestamptz;
alter table users add column if not exists last_source text;
alter table users add column if not exists last_campaign text;
alter table users add column if not exists last_content text;

create index if not exists users_first_campaign_idx on users(first_campaign);
create index if not exists users_first_content_idx on users(first_content);

-- Revenue by narrative (the weekly question):
--   select first_campaign as narrativa,
--          count(*) as leads,
--          count(*) filter (where is_paid) as vendas,
--          round(100.0 * count(*) filter (where is_paid) / nullif(count(*),0), 1) as conv_pct
--   from users
--   where first_campaign is not null and first_campaign <> ''
--   group by 1 order by vendas desc;
--
-- Same query with first_content instead of first_campaign ranks individual
-- assets inside a winning narrative.
