-- Optional demo data after creating auth users.
-- Replace UUIDs with real auth user IDs from Supabase Auth.

-- Make a staff account canteen-only:
-- update public.profiles set role = 'canteen', name = 'Main Canteen Staff' where email = 'canteen@example.edu';

-- Configure bottle points:
update public.bottle_point_rules set points = 5 where bottle_type = 'A';
update public.bottle_point_rules set points = 10 where bottle_type = 'B';
update public.bottle_point_rules set points = 15 where bottle_type = 'C';

-- Configure redemption options (points required for each discount):
update public.redemption_options set discount = 10 where points = 50;
update public.redemption_options set discount = 25 where points = 100;
update public.redemption_options set discount = 60 where points = 200;
update public.redemption_options set discount = 100 where points = 300;
