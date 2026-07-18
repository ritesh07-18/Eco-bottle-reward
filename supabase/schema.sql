-- EcoBottle Rewards System schema
-- Run in Supabase SQL Editor before policies.sql and triggers.sql.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  student_id text unique,
  email text unique not null,
  role text not null default 'student' check (role in ('student', 'canteen')),
  total_points integer not null default 0 check (total_points >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists student_id text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists total_points integer;
alter table public.profiles add column if not exists created_at timestamptz;

update public.profiles p
set email = coalesce(p.email, u.email)
from auth.users u
where p.id = u.id and p.email is null;

update public.profiles
set
  email = coalesce(email, id::text || '@missing.local'),
  name = coalesce(name, email, 'EcoBottle User'),
  role = coalesce(role, 'student'),
  total_points = coalesce(total_points, 0),
  created_at = coalesce(created_at, now());

alter table public.profiles alter column role set default 'student';
alter table public.profiles alter column total_points set default 0;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column name set not null;
alter table public.profiles alter column email set not null;
alter table public.profiles alter column role set not null;
alter table public.profiles alter column total_points set not null;
alter table public.profiles alter column created_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('student', 'canteen'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_total_points_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_total_points_check check (total_points >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_student_id_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_student_id_key unique (student_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_email_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_email_key unique (email);
  end if;
end $$;

drop view if exists public.users;
create view public.users
with (security_invoker = true) as
select id, name, student_id, email, total_points, created_at
from public.profiles
where role = 'student';

create table if not exists public.bottle_point_rules (
  bottle_type text primary key,
  points integer not null check (points > 0),
  updated_at timestamptz not null default now()
);

insert into public.bottle_point_rules (bottle_type, points)
values ('A', 5), ('B', 10), ('C', 15)
on conflict (bottle_type) do update set points = excluded.points, updated_at = now();

create table if not exists public.bottles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bottle_type text not null references public.bottle_point_rules(bottle_type),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  machine_id text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'coupon_status' and n.nspname = 'public'
  ) then
    create type public.coupon_status as enum ('ACTIVE', 'USED', 'EXPIRED');
  end if;
end $$;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coupon_code text not null unique,
  points_used integer not null check (points_used > 0),
  discount_value integer not null check (discount_value > 0),
  status public.coupon_status not null default 'ACTIVE',
  expiry_time timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  canteen_user uuid not null references public.profiles(id) on delete restrict,
  discount_amount integer not null check (discount_amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists bottles_user_created_idx on public.bottles (user_id, created_at desc);
create index if not exists coupons_user_created_idx on public.coupons (user_id, created_at desc);
create index if not exists coupons_code_idx on public.coupons (coupon_code);
create index if not exists transactions_coupon_idx on public.transactions (coupon_id);
