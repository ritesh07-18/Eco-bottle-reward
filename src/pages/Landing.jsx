import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  CheckCircle2,
  CupSoda,
  Leaf,
  LockKeyhole,
  Recycle,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { ThemeToggle } from '../components/layout/ThemeToggle';

const steps = [
  { title: 'Deposit a bottle', text: 'Students insert plastic bottles into the smart machine.', icon: CupSoda },
  { title: 'ESP32 records data', text: 'Sensors detect the bottle type and machine location.', icon: ScanLine },
  { title: 'Points update instantly', text: 'Supabase triggers calculate and add reward points.', icon: BarChart3 },
  { title: 'Redeem in canteen', text: 'Students generate a timed discount coupon for staff verification.', icon: BadgeIndianRupee },
];

const benefits = [
  'Real-time recycling reward balance',
  'Secure coupon validation for canteen staff',
  'Transparent bottle and redemption history',
  'Configurable points for bottle categories',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f7fbf8] text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
            <a href="#overview" className="hover:text-eco-700 dark:hover:text-eco-300">
              Overview
            </a>
            <a href="#workflow" className="hover:text-eco-700 dark:hover:text-eco-300">
              How it works
            </a>
            <a href="#benefits" className="hover:text-eco-700 dark:hover:text-eco-300">
              Benefits
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="btn-secondary hidden sm:inline-flex">
              Login
            </Link>
            <Link to="/signup" className="btn-primary">
              Signup
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-eco-100 bg-[radial-gradient(circle_at_20%_20%,rgba(183,245,211,0.9),transparent_28%),linear-gradient(135deg,#f7fbf8_0%,#e8fbef_54%,#d9fbe8_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(12,164,93,0.22),transparent_28%),linear-gradient(135deg,#07140f_0%,#0b1f17_58%,#0f2f22_100%)]">
          <div className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-10 py-16 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-eco-800 shadow-sm dark:bg-white/10 dark:text-eco-100">
                <Leaf size={16} />
                Smart recycling rewards for colleges
              </span>
              <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
                EcoBottle Rewards System
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
                A responsive college recycling website where students earn points from ESP32-powered bottle machines
                and redeem them for verified canteen discounts.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup" className="btn-primary h-12">
                  Start recycling
                  <ArrowRight size={18} />
                </Link>
                <Link to="/canteen/login" className="btn-secondary h-12">
                  Canteen portal
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="surface rounded-2xl p-5">
                <div className="rounded-xl bg-slate-950 p-5 text-white dark:bg-black">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-eco-200">Student balance</p>
                      <p className="mt-1 text-4xl font-bold">1,240 pts</p>
                    </div>
                    <Recycle className="text-eco-300" size={42} />
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {['Bottles', 'Coupons', 'CO2 saved'].map((item, index) => (
                      <div key={item} className="rounded-lg bg-white/10 p-3">
                        <p className="text-xs text-slate-300">{item}</p>
                        <p className="mt-2 text-xl font-bold">{[86, 9, '14kg'][index]}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {['Bottle Type B detected', 'Coupon DISC-4821 active'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-100 p-4 dark:border-white/10">
                      <CheckCircle2 className="text-eco-600" size={20} />
                      <span className="text-sm font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="overview" className="container-page py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-eco-700 dark:text-eco-300">Project overview</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A complete recycling loop from machine to meal discount</h2>
            </div>
            <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
              EcoBottle connects physical recycling machines to Supabase. Every bottle entry becomes an auditable record,
              points are updated by database logic, and coupons can only be redeemed once by authorized canteen staff.
            </p>
          </div>
        </section>

        <section id="workflow" className="border-y border-slate-200 bg-white py-20 dark:border-white/10 dark:bg-slate-900/45">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-eco-700 dark:text-eco-300">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Sensor to reward in four steps</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-eco-100 text-eco-700 dark:bg-eco-900/40 dark:text-eco-200">
                    <step.icon size={21} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="container-page py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-eco-700 dark:text-eco-300">Benefits</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for students, staff, and operations</h2>
            </div>
            <div className="grid gap-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                  <ShieldCheck className="text-eco-600" size={20} />
                  <span className="font-semibold">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-white/10">
        <div className="container-page flex flex-col justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
          <span>EcoBottle Rewards System</span>
          <span className="inline-flex items-center gap-2">
            <LockKeyhole size={16} />
            Supabase Auth, RLS, and verified coupon transactions
          </span>
        </div>
      </footer>
    </div>
  );
}
