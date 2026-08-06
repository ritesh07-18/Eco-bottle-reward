import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Logo } from '../components/layout/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="container-page flex h-16 items-center justify-between">
        <Link to="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="surface mx-auto w-full max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-eco-100 text-eco-700 dark:bg-eco-900/40 dark:text-eco-200">
            <Recycle size={26} />
          </div>
          <p className="mt-6 text-6xl font-black tracking-tight text-slate-950 dark:text-white">404</p>
          <h1 className="mt-3 text-xl font-bold">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-primary">
              Back to home
            </Link>
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
