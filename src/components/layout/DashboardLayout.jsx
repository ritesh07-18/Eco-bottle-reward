import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Gift, History, LayoutDashboard, LogOut, Recycle, SearchCheck } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'Bottle History', icon: Recycle },
  { to: '/redeem', label: 'Redeem', icon: Gift },
  { to: '/coupons', label: 'Coupons', icon: History },
];

const canteenLinks = [{ to: '/canteen/dashboard', label: 'Verify Coupons', icon: SearchCheck }];

export function DashboardLayout({ role = 'student' }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const links = role === 'canteen' ? canteenLinks : studentLinks;

  async function handleSignOut() {
    await signOut();
    navigate(role === 'canteen' ? '/canteen/login' : '/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white/95 p-5 dark:border-white/10 dark:bg-slate-950/95 lg:block">
        <Link to="/" className="block">
          <Logo />
        </Link>
        <nav className="mt-8 space-y-2">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-eco-50 hover:text-eco-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-eco-200',
                  isActive && 'bg-eco-100 text-eco-900 dark:bg-eco-900/40 dark:text-eco-100',
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="lg:hidden">
              <Logo />
            </Link>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as</p>
              <p className="font-semibold">{profile?.name ?? profile?.email ?? 'EcoBottle user'}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button type="button" className="btn-secondary h-10" onClick={handleSignOut}>
                <LogOut size={17} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300',
                    isActive && 'bg-eco-100 text-eco-900 dark:bg-eco-900/40 dark:text-eco-100',
                  )
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
