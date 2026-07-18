import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthPage } from './Login';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', studentId: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signUp(form);
      setMessage('Account created. Check your email if confirmation is enabled, then login.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage>
      <form onSubmit={handleSubmit} className="surface mx-auto w-full max-w-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Create Student Account</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Register to start earning EcoBottle points.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="fullName">
              Full Name
            </label>
            <input className="input mt-1.5" id="fullName" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="studentId">
              Student ID
            </label>
            <input className="input mt-1.5" id="studentId" value={form.studentId} onChange={(e) => updateField('studentId', e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input mt-1.5" id="email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input className="input mt-1.5" id="password" type="password" minLength={8} value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
          </div>
          {!isSupabaseConfigured && <p className="text-sm text-amber-700 dark:text-amber-200">Add Supabase env vars to enable signup.</p>}
          {message && <p className="text-sm font-medium text-eco-700 dark:text-eco-200">{message}</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={loading || !isSupabaseConfigured}>
            <UserPlus size={18} />
            {loading ? 'Creating...' : 'Signup'}
          </button>
          <Link className="btn-secondary w-full" to="/login">
            Go to Login
          </Link>
        </div>
      </form>
    </AuthPage>
  );
}
