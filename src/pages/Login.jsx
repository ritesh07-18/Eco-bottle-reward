import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await signIn(email, password);
      const role = data.user?.user_metadata?.role;
      navigate(role === 'canteen' ? '/canteen/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage>
      <form onSubmit={handleSubmit} className="surface mx-auto w-full max-w-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Student Login</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Access your points, bottle history, and coupons.</p>
        {!isSupabaseConfigured && <DemoNotice />}
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input mt-1.5" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input className="input mt-1.5" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={loading || !isSupabaseConfigured}>
            <LogIn size={18} />
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {!isSupabaseConfigured && (
            <Link className="btn-secondary w-full" to="/dashboard">
              View demo dashboard
            </Link>
          )}
          <Link className="btn-secondary w-full" to="/signup">
            Go to Signup
          </Link>
        </div>
      </form>
    </AuthPage>
  );
}

export function AuthPage({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="container-page flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">{children}</main>
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
      Supabase environment variables are not set. Authentication is disabled, but demo pages are available.
    </div>
  );
}
