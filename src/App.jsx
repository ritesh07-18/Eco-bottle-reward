import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const BottleHistory = lazy(() => import('./pages/BottleHistory'));
const Redeem = lazy(() => import('./pages/Redeem'));
const CouponHistory = lazy(() => import('./pages/CouponHistory'));
const CanteenLogin = lazy(() => import('./pages/CanteenLogin'));
const CanteenDashboard = lazy(() => import('./pages/CanteenDashboard'));

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/canteen/login" element={<CanteenLogin />} />

          <Route element={<ProtectedRoute role="student" />}>
            <Route element={<DashboardLayout role="student" />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/history" element={<BottleHistory />} />
              <Route path="/redeem" element={<Redeem />} />
              <Route path="/coupons" element={<CouponHistory />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="canteen" />}>
            <Route element={<DashboardLayout role="canteen" />}>
              <Route path="/canteen/dashboard" element={<CanteenDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-eco-200 border-t-eco-700" />
    </div>
  );
}
