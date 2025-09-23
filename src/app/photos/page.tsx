'use client';

import { useState } from 'react';
import { Container } from '@/components/Container';
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
      <SimpleLayout
        title='Photos'
        intro='Share your moments with beautiful photos.'
      >
        <Container>
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-teal-600'></div>
          </div>
        </Container>
      </SimpleLayout>
    );
  }

  if (!user) {
    return (
      <SimpleLayout
        title='Photos'
        intro='Share your moments with beautiful photos.'
      >
        <Container>
          <div className='py-12 text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
              <svg
                className='h-6 w-6 text-zinc-400'
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
            <h3 className='mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
              Please log in
            </h3>
            <p className='mb-4 text-zinc-600 dark:text-zinc-400'>
              You need to be logged in to upload and view photos.
            </p>
            <a
              href='/login'
              className='inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700'
            >
              Log in
            </a>
          </div>
        </Container>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout
      title='Photos'
      intro='Share your moments with beautiful photos.'
    >
      <Container>
        <div className='space-y-8'>
          {(uploadError || uploadSuccess || feedError) && (
            <div className='space-y-4'>
              {uploadSuccess && (
                <div className='rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-green-800 dark:text-green-200'>
                      {uploadSuccess}
                    </p>
                    <button
                      onClick={() => setUploadSuccess(null)}
                      className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                    >
                      <svg
                        className='h-4 w-4'
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
                <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-red-800 dark:text-red-200'>
                      {uploadError || feedError}
                    </p>
                    <button
                      onClick={clearErrors}
                      className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                    >
                      <svg
                        className='h-4 w-4'
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

          <div className='rounded-2xl border border-zinc-100 bg-white p-6 dark:border-zinc-700/40 dark:bg-zinc-900'>
            <h2 className='mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
              Upload a Photo
            </h2>
            <PhotoUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          <div>
            <h2 className='mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
              Your Photos
            </h2>
            <PhotoFeed
              refreshTrigger={refreshTrigger}
              onError={handleFeedError}
            />
          </div>
        </div>
      </Container>
    </SimpleLayout>
  );
}
