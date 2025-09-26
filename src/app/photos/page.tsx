'use client';

import { useState } from 'react';
import { Container } from '@/components/Container';
import { PageBackground } from '@/components/PageBackground';
import { SimpleLayout } from '@/components/SimpleLayout';
import { PhotoFeed } from '@/components/PhotoFeed';

export default function PhotosPage() {
  const [feedError, setFeedError] = useState<string | null>(null);

  const handleFeedError = (error: string) => {
    setFeedError(error);
  };

  // Public page - no authentication required

  return (
    <>
      <PageBackground />

      <div className='relative min-h-screen overflow-hidden'>
        <div className='relative z-10 pb-16 pt-32'>
          <Container>
            {/* Header */}
            <div className='mx-auto mb-16 max-w-4xl text-center'>
              <h1 className='mb-6 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
                Photos
              </h1>
              <p className='text-xl font-light leading-relaxed text-zinc-600 md:text-2xl dark:text-zinc-400'>
                Capturing moments, sharing memories through beautiful imagery
              </p>
            </div>

            {/* Content */}
            <div className='mx-auto max-w-4xl space-y-12'>
              {/* Error Messages */}
              {feedError && (
                <div className='relative overflow-hidden rounded-2xl border border-red-200/50 bg-red-50/80 p-6 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20'>
                  <div className='absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5' />
                  <div className='relative z-10 flex items-center justify-between'>
                    <p className='font-medium text-red-800 dark:text-red-200'>
                      {feedError}
                    </p>
                    <button
                      onClick={() => setFeedError(null)}
                      className='text-red-600 transition-colors duration-200 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                    >
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Gallery Section */}
              <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/50 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                <div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5' />
                <div className='relative z-10'>
                  <PhotoFeed onError={handleFeedError} />
                </div>
              </div>

              {/* Admin Link (subtle) */}
              <div className='text-center pt-8'>
                <a
                  href='/admin'
                  className='text-xs text-zinc-400 transition-colors duration-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'
                >
                  Admin Access
                </a>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}
