import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error('Missing env: set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY');
  console.error('(Add SUPABASE_SECRET_KEY to .env.local - it is gitignored)');
  process.exit(1);
}

const admin = createClient(url, secretKey, { auth: { persistSession: false } });

const users = [
  { full_name: 'Riya Sharma', student_id: '9876543210', password: 'student123', role: 'student' },
  { full_name: 'Main Canteen Staff', student_id: null, password: 'canteen123', role: 'canteen', email: 'canteen@example.edu' },
];

async function warmup() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      return;
    } catch (e) {
      console.log(`WARMUP retry ${attempt}/5: ${e.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function createUser(u) {
  const email = u.email ?? `${u.student_id}@eco.in`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          student_id: u.student_id,
          role: u.role,
        },
      });
      if (error) {
        console.error(`FAILED ${email}: ${error.message}`);
        return;
      }
      console.log(`CREATED ${email} -> id ${data.user.id} (role=${u.role})`);
      return;
    } catch (e) {
      if (attempt === 3) {
        console.error(`FAILED ${email} after 3 attempts: ${e.message}`);
      } else {
        console.log(`RETRY ${email} (${attempt}/3): ${e.message}`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
}

await warmup();

for (const u of users) {
  await createUser(u);
}