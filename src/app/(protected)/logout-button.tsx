'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function readCookie(name: string): string | undefined {
  return document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`))?.split('=')[1];
}

export function LogoutButton(): React.ReactElement {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  async function logout(): Promise<void> {
    setSubmitting(true);
    const csrfToken = readCookie('ems_csrf_token');
    const response = await fetch('/api/v1/auth/logout', { method: 'POST', headers: csrfToken ? { 'x-csrf-token': decodeURIComponent(csrfToken) } : {} });
    if (response.ok) {
      router.replace('/login');
      router.refresh();
      return;
    }
    setSubmitting(false);
  }
  return <button type="button" disabled={submitting} onClick={logout} className="rounded-lg bg-[#a71930] px-3 py-2 text-sm font-semibold text-white hover:bg-[#801226] disabled:opacity-60">{submitting ? 'Signing out…' : 'Sign out'}</button>;
}
