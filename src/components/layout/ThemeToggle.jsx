import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      className="btn-secondary h-10 w-10 px-0"
      onClick={() => setDark((value) => !value)}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
