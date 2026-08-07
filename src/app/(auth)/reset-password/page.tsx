'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetPasswordForm(): React.ReactElement {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string>();
  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const response = await fetch('/api/v1/auth/password-reset/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const payload = await response.json();
    setMessage(response.ok ? 'Password reset. You can now sign in.' : payload.error.message);
  }
  return <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-2xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm text-slate-600">Use at least 12 characters with uppercase, lowercase, and a number.</p><form onSubmit={submit} className="mt-6 space-y-4"><label htmlFor="password" className="block text-sm font-medium">New password</label><input id="password" type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border px-3 py-2" /><button disabled={!token} className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50">Reset password</button></form>{message ? <p role="status" className="mt-4 text-sm text-slate-700">{message}</p> : null}</section>;
}

export default function ResetPasswordPage(): React.ReactElement {
  return <main className="flex min-h-screen items-center justify-center px-4"><Suspense fallback={<p>Loading…</p>}><ResetPasswordForm /></Suspense></main>;
}
