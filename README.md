# EcoBottle Rewards System

EcoBottle Rewards System is a production-ready college recycling rewards website. Students earn points when ESP32-powered bottle machines submit bottle events to Supabase, then redeem those points for canteen discount coupons. Canteen staff verify and mark coupons as used from a separate portal.

## Stack

- React, Vite, Tailwind CSS, React Router
- Supabase Auth, PostgreSQL, RLS, RPC functions
- Recharts for dashboard charts
- Lucide React icons
- ESP32 sample using `WiFi.h` and `HTTPClient.h`

## Routes

- `/` public website
- `/login` student login
- `/signup` student registration
- `/dashboard` student dashboard
- `/history` bottle history
- `/redeem` coupon redemption
- `/coupons` coupon history
- `/canteen/login` staff login
- `/canteen/dashboard` coupon verification
- `/canteen/transactions` redemption history

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Add your Supabase values to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

If the environment variables are missing, the website still opens with demo dashboard data so the UI can be reviewed.

## Supabase Setup

Run these files in this order from the Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/triggers.sql`
3. `supabase/policies.sql`
4. Optional: `supabase/seed.sql`

The implementation uses `public.profiles` instead of a physical `public.users` table because Supabase already has `auth.users`. A compatibility view named `public.users` is included for the requested user shape.

## Auth Setup

Student accounts are phone-based. Signup takes a name, a 10-digit phone number, and a password. The account email is generated as `<phone>@eco.in` and the phone is stored in `profiles.student_id` via Auth metadata:

```json
{
  "full_name": "Student Name",
  "student_id": "9876543210",
  "role": "student"
}
```

Login accepts either the phone number (auto-converted to `<phone>@eco.in`) or a full email.

The `handle_new_auth_user` trigger creates the matching profile row.

For canteen staff:

1. Create a user in Supabase Auth.
2. Run:

```sql
update public.profiles
set role = 'canteen', name = 'Main Canteen Staff'
where email = 'canteen@example.edu';
```

## Points Logic

Bottle point values are configurable in `public.bottle_point_rules`.

Defaults:

- Type A: 5 points
- Type B: 10 points
- Type C: 15 points

When a row is inserted into `public.bottles`, the `apply_bottle_points` trigger reads the bottle type, writes `points_awarded`, and increments `profiles.total_points`.

## Coupon Logic

Redemption options (points -> discount value) are configurable in `public.redemption_options`.

Defaults:

- 50 points -> Rs 10
- 100 points -> Rs 25
- 200 points -> Rs 60
- 300 points -> Rs 100

Student redemption calls `redeem_coupon(p_user_id, p_points_used)`. The discount is resolved from `redemption_options` on the server (clients cannot set it). The RPC:

- Checks the student owns the request
- Locks the profile row
- Confirms sufficient points
- Deducts points
- Generates a unique `DISC-0000` style coupon
- Sets expiry to 24 hours
- Stores status as `ACTIVE`

Canteen staff use:

- `verify_coupon(p_coupon_code)`
- `mark_coupon_used(p_coupon_code)`

The database rejects expired and already-used coupons. `mark_coupon_used` locks the coupon row and creates a transaction record, preventing duplicate usage. Staff can review past redemptions on `/canteen/transactions`.

## ESP32 Integration

Recommended production flow:

```txt
Sensor -> ESP32 -> Supabase Edge Function -> bottles table -> PostgreSQL trigger -> profile points updated
```

Deploy the Edge Function:

```bash
supabase functions deploy esp32-bottle-intake
supabase secrets set ESP32_DEVICE_SECRET=CHANGE_ME_DEVICE_SECRET
```

The Edge Function supports two actions:

- `login` — verifies `phone` + `password` against Supabase Auth and returns a short-lived session token plus the student's name and current points.
- `intake` — validates the session token, inserts the bottle row, and the `apply_bottle_points` trigger credits the points.

Both actions require the `x-device-secret` header plus the Supabase anon/publishable key in the `Authorization`/`apikey` headers.

Login request:

```json
{
  "action": "login",
  "phone": "9876543210",
  "password": "student-password"
}
```

Intake request (token from login):

```json
{
  "action": "intake",
  "user_id": "authenticated-user-uuid",
  "access_token": "session-token-from-login",
  "bottle_type": "A",
  "machine_id": "COLLEGE-01"
}
```

The `phone` must match a registered account (`<phone>@eco.in`). An expired or invalid token is rejected with HTTP 401, so bottle points can only be earned while logged in.

The touchscreen sample is in `esp32/EcoBottleTFT.ino` — a student types their phone number and password on a 3.5" ILI9488 resistive-touch TFT (KMRTM35018-SPI), logs in, then deposits a bottle when the sensor detects it. Full wiring and library setup instructions are in the header of the sketch. The older Serial-entry sketch is `esp32/EcoBottleSupabase.ino`.

## Deployment

Build the site:

```bash
npm run build
```

Deploy the generated `dist` folder to Vercel, Netlify, Cloudflare Pages, or any static host. Configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in the hosting provider.

## Security Notes

- Route protection is enforced in React and backed by Supabase RLS.
- Students can read their own profile, bottle rows, and coupon history.
- Canteen staff can read coupons and transactions.
- Coupon usage is validated in PostgreSQL RPC functions.
- Bottle rows are inserted only through the ESP32 Edge Function (service role). Authenticated users cannot insert bottle rows directly, so points cannot be farmed from the client.
- ESP32 should call the Edge Function with a device secret. Avoid embedding a Supabase service role key in firmware.
