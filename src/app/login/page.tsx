'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Container } from '@/components/Container';

const SITE_API_BASE = ''; // app routes under /api

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${SITE_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className='mt-16 sm:mt-32'>
      <div className='mx-auto max-w-sm'>
        <h1 className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>
          Sign in
        </h1>
        <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-400'>
          Use your email and password to access your account.
        </p>
        <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
            />
          </div>
          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}
          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-60'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </Container>
  );
}
