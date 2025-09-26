'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/Container';
import { PageBackground } from '@/components/PageBackground';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to admin photo upload page
      router.push('/admin/photos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBackground />
      <div className='relative min-h-screen overflow-hidden'>
        <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
          <Container>
            <div className='mx-auto max-w-md'>
              <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/70'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5' />
                <div className='relative z-10'>
                  <div className='mb-8 text-center'>
                    <h1 className='mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100'>
                      Admin Access
                    </h1>
                    <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                      Sign in to manage your portfolio content
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className='space-y-6'>
                    <div>
                      <label
                        htmlFor='email'
                        className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
                      >
                        Email
                      </label>
                      <input
                        id='email'
                        type='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className='w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-zinc-900 placeholder-zinc-500 backdrop-blur-sm transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-400'
                        placeholder='admin@example.com'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='password'
                        className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
                      >
                        Password
                      </label>
                      <input
                        id='password'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className='w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-zinc-900 placeholder-zinc-500 backdrop-blur-sm transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-400'
                        placeholder='Enter your password'
                      />
                    </div>

                    {error && (
                      <div className='rounded-xl border border-red-200/50 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-200'>
                        {error}
                      </div>
                    )}

                    <button
                      type='submit'
                      disabled={loading}
                      className='w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {loading ? (
                        <span className='flex items-center justify-center'>
                          <svg
                            className='mr-2 h-5 w-5 animate-spin'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            />
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                            />
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>
                </div>
              </div>

              <div className='mt-6 text-center'>
                <a
                  href='/'
                  className='text-sm text-zinc-600 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                >
                  ← Back to Portfolio
                </a>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}