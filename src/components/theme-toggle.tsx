'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return <button type="button" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={() => setTheme(dark ? 'light' : 'dark')} className="rounded-lg border p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
