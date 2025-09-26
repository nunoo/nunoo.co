'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/Container';
import { PageBackground } from '@/components/PageBackground';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PhotoFeed } from '@/components/PhotoFeed';
import { useMe } from '@/lib/useMe';

export default function AdminPhotosPage() {
  const router = useRouter();
  const { user, loading: userLoading, error: userError } = useMe();
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Redirect if not authenticated
    if (!userLoading && !user) {
      router.push('/admin');
    }
  }, [user, userLoading, router]);

  const handleUploadSuccess = (photo: any) => {
    setUploadSuccess('Photo uploaded successfully!');
    setUploadError(null);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
  };

  const handleFeedError = (error: string) => {
    setFeedError(error);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (userLoading) {
    return (
      <>
        <PageBackground />
        <div className='relative min-h-screen overflow-hidden'>
          <div className='relative z-10 flex min-h-screen items-center justify-center'>
            <div className='relative'>
              <div className='h-16 w-16 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500'></div>
              <div className='absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-blue-500/20'></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <>
      <PageBackground />
      <div className='relative min-h-screen overflow-hidden'>
        <div className='relative z-10 pb-16 pt-32'>
          <Container>
            {/* Header with Logout */}
            <div className='mx-auto mb-16 max-w-4xl'>
              <div className='flex items-center justify-between'>
                <div>
                  <h1 className='mb-2 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
                    Admin Photo Manager
                  </h1>
                  <p className='text-lg text-zinc-600 dark:text-zinc-400'>
                    Upload and manage your portfolio photos
                  </p>
                </div>
                <div className='flex items-center space-x-4'>
                  <span className='text-sm text-zinc-600 dark:text-zinc-400'>
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className='rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className='mx-auto max-w-4xl space-y-12'>
              {/* Status Messages */}
              {(uploadError || uploadSuccess || feedError) && (
                <div className='space-y-4'>
                  {uploadSuccess && (
                    <div className='relative overflow-hidden rounded-2xl border border-green-200/50 bg-green-50/80 p-6 backdrop-blur-sm dark:border-green-800/50 dark:bg-green-900/20'>
                      <div className='absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5' />
                      <div className='relative z-10 flex items-center justify-between'>
                        <p className='font-medium text-green-800 dark:text-green-200'>
                          {uploadSuccess}
                        </p>
                        <button
                          onClick={() => setUploadSuccess(null)}
                          className='text-green-600 transition-colors duration-200 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                        >
                          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {(uploadError || feedError) && (
                    <div className='relative overflow-hidden rounded-2xl border border-red-200/50 bg-red-50/80 p-6 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20'>
                      <div className='absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5' />
                      <div className='relative z-10 flex items-center justify-between'>
                        <p className='font-medium text-red-800 dark:text-red-200'>
                          {uploadError || feedError}
                        </p>
                        <button
                          onClick={() => {
                            setUploadError(null);
                            setFeedError(null);
                          }}
                          className='text-red-600 transition-colors duration-200 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                        >
                          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Section */}
              <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/70'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5' />
                <div className='relative z-10'>
                  <h2 className='mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
                    Upload New Photo
                  </h2>
                  <PhotoUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                  />
                </div>
              </div>

              {/* Photo Management Section */}
              <div>
                <h2 className='mb-8 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
                  Manage Your Photos
                </h2>
                <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/50 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                  <div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5' />
                  <div className='relative z-10'>
                    <PhotoFeed
                      refreshTrigger={refreshTrigger}
                      onError={handleFeedError}
                      isAdmin={true}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className='flex justify-center space-x-6 pt-8'>
                <a
                  href='/'
                  className='text-sm text-zinc-600 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                >
                  ← Back to Portfolio
                </a>
                <a
                  href='/photos'
                  className='text-sm text-zinc-600 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                >
                  View Public Gallery →
                </a>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}