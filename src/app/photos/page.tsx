'use client';

import { useState } from 'react';
import { Container } from '@/components/Container';
import { PageBackground } from '@/components/PageBackground';
import { SimpleLayout } from '@/components/SimpleLayout';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PhotoFeed } from '@/components/PhotoFeed';
import { useMe } from '@/lib/useMe';

export default function PhotosPage() {
  const { user, loading: userLoading, error: userError } = useMe();
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const clearErrors = () => {
    setUploadError(null);
    setFeedError(null);
  };

  if (userLoading) {
    return (
      <>
        <PageBackground />

        <div className='relative min-h-screen overflow-hidden'>
          <div className='relative z-10 pt-32'>
            <Container>
              <div className='mx-auto mb-16 max-w-4xl text-center'>
                <h1 className='mb-6 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
                  Photos
                </h1>
                <p className='text-xl font-light leading-relaxed text-zinc-600 md:text-2xl dark:text-zinc-400'>
                  Capturing moments, sharing memories through beautiful imagery
                </p>
              </div>

              <div className='flex items-center justify-center py-20'>
                <div className='relative'>
                  <div className='h-16 w-16 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500'></div>
                  <div className='absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-blue-500/20'></div>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageBackground />

        <div className='relative min-h-screen overflow-hidden'>
          <div className='relative z-10 pt-32'>
            <Container>
              <div className='mx-auto mb-16 max-w-4xl text-center'>
                <h1 className='mb-6 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
                  Photos
                </h1>
                <p className='text-xl font-light leading-relaxed text-zinc-600 md:text-2xl dark:text-zinc-400'>
                  Capturing moments, sharing memories through beautiful imagery
                </p>
              </div>

              <div className='py-20'>
                <div className='mx-auto max-w-md text-center'>
                  <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 p-12 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/70'>
                    <div className='absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5' />
                    <div className='relative z-10'>
                      <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20'>
                        <svg
                          className='h-8 w-8 text-red-500 dark:text-red-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                          />
                        </svg>
                      </div>
                      <h3 className='mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
                        Authentication Required
                      </h3>
                      <p className='mb-8 leading-relaxed text-zinc-600 dark:text-zinc-400'>
                        You need to be logged in to upload and view photos. Join
                        our community to start sharing your memories.
                      </p>
                      <a
                        href='/login'
                        className='inline-flex items-center rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-8 py-4 text-lg font-medium text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-red-700 hover:to-orange-700 hover:shadow-red-500/25'
                      >
                        Log in to Continue
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </>
    );
  }

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

                  {(uploadError || feedError) && (
                    <div className='relative overflow-hidden rounded-2xl border border-red-200/50 bg-red-50/80 p-6 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20'>
                      <div className='absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5' />
                      <div className='relative z-10 flex items-center justify-between'>
                        <p className='font-medium text-red-800 dark:text-red-200'>
                          {uploadError || feedError}
                        </p>
                        <button
                          onClick={clearErrors}
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
                </div>
              )}

              {/* Upload Section */}
              <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/70'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5' />
                <div className='relative z-10'>
                  <h2 className='mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
                    Upload a Photo
                  </h2>
                  <PhotoUpload
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                  />
                </div>
              </div>

              {/* Photo Feed Section */}
              <div>
                <h2 className='mb-8 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
                  Your Photo Collection
                </h2>
                <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/50 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                  <div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5' />
                  <div className='relative z-10'>
                    <PhotoFeed
                      refreshTrigger={refreshTrigger}
                      onError={handleFeedError}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
}
