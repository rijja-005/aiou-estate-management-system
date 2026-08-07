'use client';

import { useState } from 'react';

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string>();
  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const response = await fetch('/api/v1/auth/password-reset/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
    const payload = await response.json();
    setMessage(response.ok ? payload.data.message : 'Enter a valid email address.');
  }
  return <main className="flex min-h-screen items-center justify-center px-4"><section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-2xl font-semibold">Reset your password</h1><p className="mt-2 text-sm text-slate-600">Enter your account email to receive a time-limited reset link.</p><form onSubmit={submit} className="mt-6 space-y-4"><label htmlFor="email" className="block text-sm font-medium">Email</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border px-3 py-2" /><button className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white">Send reset link</button></form>{message ? <p role="status" className="mt-4 text-sm text-slate-700">{message}</p> : null}</section></main>;
}
