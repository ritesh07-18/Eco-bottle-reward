-- EcoBottle triggers and secure RPC functions.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, student_id, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'student')
  )
  on conflict (id) do update
    set name = excluded.name,
        student_id = excluded.student_id,
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.apply_bottle_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  calculated_points integer;
begin
  select points into calculated_points
  from public.bottle_point_rules
  where bottle_type = new.bottle_type;

  if calculated_points is null then
    raise exception 'Unknown bottle type: %', new.bottle_type;
  end if;

  new.points_awarded := calculated_points;

  update public.profiles
  set total_points = total_points + calculated_points
  where id = new.user_id and role = 'student';

  return new;
end;
$$;

drop trigger if exists before_bottle_insert_apply_points on public.bottles;
create trigger before_bottle_insert_apply_points
before insert on public.bottles
for each row execute function public.apply_bottle_points();

create or replace function public.expire_old_coupons()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.coupons
  set status = 'EXPIRED'
  where status = 'ACTIVE' and expiry_time < now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.random_coupon_code()
returns text
language plpgsql
as $$
begin
  return 'DISC-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');
end;
$$;

create or replace function public.redeem_coupon(
  p_user_id uuid,
  p_points_used integer,
  p_discount_value integer
)
returns public.coupons
language plpgsql
security definer
set search_path = public
as $$
declare
  current_points integer;
  new_code text;
  created_coupon public.coupons;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_points_used not in (50, 100, 200, 300) then
    raise exception 'Invalid redemption option';
  end if;

  select total_points into current_points
  from public.profiles
  where id = p_user_id and role = 'student'
  for update;

  if current_points is null then
    raise exception 'Student profile not found';
  end if;

  if current_points < p_points_used then
    raise exception 'Insufficient points';
  end if;

  loop
    new_code := public.random_coupon_code();
    exit when not exists (select 1 from public.coupons where coupon_code = new_code);
  end loop;

  update public.profiles
  set total_points = total_points - p_points_used
  where id = p_user_id;

  insert into public.coupons (user_id, coupon_code, points_used, discount_value, status, expiry_time)
  values (p_user_id, new_code, p_points_used, p_discount_value, 'ACTIVE', now() + interval '24 hours')
  returning * into created_coupon;

  return created_coupon;
end;
$$;

create or replace function public.verify_coupon(p_coupon_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  coupon_record public.coupons;
  staff_role text;
begin
  select role into staff_role from public.profiles where id = auth.uid();
  if staff_role <> 'canteen' then
    raise exception 'Only canteen users can verify coupons';
  end if;

  perform public.expire_old_coupons();

  select * into coupon_record
  from public.coupons
  where coupon_code = upper(p_coupon_code);

  if coupon_record.id is null then
    return jsonb_build_object('valid', false, 'message', 'Coupon not found.');
  end if;

  if coupon_record.status = 'USED' then
    return jsonb_build_object('valid', false, 'message', 'Coupon is already used.');
  end if;

  if coupon_record.status = 'EXPIRED' or coupon_record.expiry_time < now() then
    update public.coupons set status = 'EXPIRED' where id = coupon_record.id;
    return jsonb_build_object('valid', false, 'message', 'Coupon has expired.');
  end if;

  return jsonb_build_object('valid', true, 'message', 'Coupon is active.', 'coupon', to_jsonb(coupon_record));
end;
$$;

create or replace function public.mark_coupon_used(p_coupon_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  coupon_record public.coupons;
  staff_role text;
begin
  select role into staff_role from public.profiles where id = auth.uid();
  if staff_role <> 'canteen' then
    raise exception 'Only canteen users can mark coupons as used';
  end if;

  perform public.expire_old_coupons();

  select * into coupon_record
  from public.coupons
  where coupon_code = upper(p_coupon_code)
  for update;

  if coupon_record.id is null then
    return jsonb_build_object('success', false, 'message', 'Coupon not found.');
  end if;

  if coupon_record.status = 'USED' then
    return jsonb_build_object('success', false, 'message', 'Coupon is already used.');
  end if;

  if coupon_record.status = 'EXPIRED' or coupon_record.expiry_time < now() then
    update public.coupons set status = 'EXPIRED' where id = coupon_record.id;
    return jsonb_build_object('success', false, 'message', 'Coupon has expired.');
  end if;

  update public.coupons
  set status = 'USED'
  where id = coupon_record.id;

  insert into public.transactions (coupon_id, canteen_user, discount_amount)
  values (coupon_record.id, auth.uid(), coupon_record.discount_value);

  return jsonb_build_object('success', true, 'message', 'Coupon accepted and marked as used.');
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.apply_bottle_points() from public, anon, authenticated;
revoke execute on function public.expire_old_coupons() from public, anon, authenticated;
revoke execute on function public.random_coupon_code() from public, anon, authenticated;
revoke execute on function public.redeem_coupon(uuid, integer, integer) from public, anon;
revoke execute on function public.verify_coupon(text) from public, anon;
revoke execute on function public.mark_coupon_used(text) from public, anon;

grant execute on function public.redeem_coupon(uuid, integer, integer) to authenticated;
grant execute on function public.verify_coupon(text) to authenticated;
grant execute on function public.mark_coupon_used(text) to authenticated;
