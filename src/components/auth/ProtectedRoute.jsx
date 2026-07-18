import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export function ProtectedRoute({ role = 'student' }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-eco-200 border-t-eco-700" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={role === 'canteen' ? '/canteen/login' : '/login'} replace state={{ from: location }} />;
  }

  if (profile?.role && profile.role !== role) {
    return <Navigate to={profile.role === 'canteen' ? '/canteen/dashboard' : '/dashboard'} replace />;
  }

  return <Outlet />;
}
