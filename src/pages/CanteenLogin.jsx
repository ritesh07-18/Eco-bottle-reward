import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AuthPage } from './Login';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export default function CanteenLogin() {
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
      await signIn(email, password);
      navigate('/canteen/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage>
      <form onSubmit={handleSubmit} className="surface mx-auto w-full max-w-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Canteen Portal Login</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Verify coupon codes and record redemptions.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="canteenEmail">
              Email
            </label>
            <input className="input mt-1.5" id="canteenEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="canteenPassword">
              Password
            </label>
            <input className="input mt-1.5" id="canteenPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={loading || !isSupabaseConfigured}>
            <ShieldCheck size={18} />
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {!isSupabaseConfigured && (
            <Link className="btn-secondary w-full" to="/canteen/dashboard">
              View demo canteen dashboard
            </Link>
          )}
        </div>
      </form>
    </AuthPage>
  );
}
