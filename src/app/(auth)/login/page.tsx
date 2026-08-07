"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../../../server/auth/schemas';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput): Promise<void> {
    setErrorMessage(null);
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const payload = await response.json();
    if (!response.ok) {
      setErrorMessage(payload?.error?.message ?? 'Unable to sign in');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">AIOU Estate Office</p>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to the Estate Management System</h1>
          <p className="text-sm text-slate-600">
            Sign in with your authorized Estate Office account.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
            <input id="email" {...register('email')} type="email" className="w-full rounded-lg border px-3 py-2" placeholder="name@aiou.edu.pk" />
            {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
            <input id="password" {...register('password')} type="password" className="w-full rounded-lg border px-3 py-2" placeholder="••••••••" />
            {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
          </div>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          <button disabled={isSubmitting} type="submit" className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          <a href="/forgot-password" className="block text-center text-sm font-medium text-red-700 hover:underline">Forgot password?</a>
        </form>
      </section>
    </main>
  );
}
