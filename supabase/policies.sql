-- Row Level Security policies for EcoBottle Rewards System.

alter table public.profiles enable row level security;
alter table public.bottle_point_rules enable row level security;
alter table public.bottles enable row level security;
alter table public.coupons enable row level security;
alter table public.transactions enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Canteen can read student profile basics" on public.profiles;
create policy "Canteen can read student profile basics"
on public.profiles for select
to authenticated
using (public.current_user_role() = 'canteen');

drop policy if exists "Authenticated users can read point rules" on public.bottle_point_rules;
create policy "Authenticated users can read point rules"
on public.bottle_point_rules for select
to authenticated
using (true);

drop policy if exists "Students read own bottles" on public.bottles;
create policy "Students read own bottles"
on public.bottles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Bottle intake can insert bottles" on public.bottles;
create policy "Bottle intake can insert bottles"
on public.bottles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Students read own coupons" on public.coupons;
create policy "Students read own coupons"
on public.coupons for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Canteen can read coupons" on public.coupons;
create policy "Canteen can read coupons"
on public.coupons for select
to authenticated
using (public.current_user_role() = 'canteen');

drop policy if exists "Canteen can read transactions" on public.transactions;
create policy "Canteen can read transactions"
on public.transactions for select
to authenticated
using (public.current_user_role() = 'canteen');

grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.bottle_point_rules, public.bottles, public.coupons, public.transactions from anon;
revoke insert, update, delete on public.profiles, public.bottle_point_rules, public.coupons, public.transactions from authenticated;
grant select on public.users to authenticated;
grant select on public.bottle_point_rules to authenticated;
grant select on public.profiles, public.bottles, public.coupons, public.transactions to authenticated;
grant insert on public.bottles to authenticated;
grant execute on function public.redeem_coupon(uuid, integer, integer) to authenticated;
grant execute on function public.verify_coupon(text) to authenticated;
grant execute on function public.mark_coupon_used(text) to authenticated;
