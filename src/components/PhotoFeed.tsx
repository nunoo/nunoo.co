'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDate } from '@/lib/formatDate';

interface Photo {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  caption?: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

interface PhotoFeed {
  photos: Photo[];
  page: number;
  limit: number;
  total_count: number;
  has_more: boolean;
}

interface PhotoFeedProps {
  refreshTrigger?: number;
  onError?: (error: string) => void;
  isAdmin?: boolean;
}

export function PhotoFeed({
  refreshTrigger,
  onError,
  isAdmin = false,
}: PhotoFeedProps) {
  const [feed, setFeed] = useState<PhotoFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/photos/feed?page=${page}&limit=20`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch photos');
      }

      const data: PhotoFeed = await response.json();

      if (append && feed) {
        setFeed({
          ...data,
          photos: [...feed.photos, ...data.photos],
        });
      } else {
        setFeed(data);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load photos';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (feed && feed.has_more && !loadingMore) {
      fetchPhotos(feed.page + 1, true);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/?id=${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      if (feed) {
        setFeed({
          ...feed,
          photos: feed.photos.filter((photo) => photo.id !== photoId),
          total_count: feed.total_count - 1,
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete photo';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className='space-y-8'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='animate-pulse'>
            <div className='mb-4 aspect-[4/3] rounded-2xl bg-zinc-200 dark:bg-zinc-700'></div>
            <div className='px-6'>
              <div className='mb-3 h-6 rounded bg-zinc-200 dark:bg-zinc-700'></div>
              <div className='h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !feed) {
    return (
      <div className='py-12 text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
          <svg
            className='h-6 w-6 text-red-600 dark:text-red-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <h3 className='mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
          Failed to load photos
        </h3>
        <p className='mb-4 text-zinc-600 dark:text-zinc-400'>{error}</p>
        <button
          onClick={() => fetchPhotos()}
          className='rounded-md bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700'
        >
          Try again
        </button>
      </div>
    );
  }

  if (!feed || feed.photos.length === 0) {
    return (
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
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
        </div>
        <h3 className='mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
          No photos yet
        </h3>
        <p className='text-zinc-600 dark:text-zinc-400'>
          Upload your first photo to get started!
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
          <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
        </div>
      )}

      <div className='space-y-8'>
        {feed.photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onDelete={deletePhoto}
            showDeleteButton={isAdmin}
          />
        ))}
      </div>

      {feed.has_more && (
        <div className='text-center'>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className='rounded-lg bg-zinc-100 px-6 py-3 text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onDelete: (photoId: string) => void;
  showDeleteButton?: boolean;
}

function PhotoCard({
  photo,
  onDelete,
  showDeleteButton = false,
}: PhotoCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(photo.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className='group relative overflow-hidden rounded-2xl bg-white shadow-lg shadow-zinc-800/10 ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800'>
      <div className='relative'>
        <Image
          src={photo.public_url}
          alt={photo.caption || 'Photo'}
          width={photo.width || 1200}
          height={photo.height || 800}
          className='w-full h-auto object-contain'
          sizes='100vw'
          priority={false}
          quality={90}
          style={{ maxHeight: '80vh' }}
        />

        {showDeleteButton && (
          <div className='absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100'>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className='rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70'
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
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>
            ) : (
              <div className='flex gap-1'>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className='rounded-full bg-red-600 p-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50'
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
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className='rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:opacity-50'
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
            )}
          </div>
        )}
      </div>

      <div className='p-6'>
        {photo.caption && (
          <p className='mb-3 text-lg text-zinc-900 dark:text-zinc-100'>
            {photo.caption}
          </p>
        )}
        <div className='flex items-center justify-between'>
          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            {formatDate(photo.created_at)}
          </p>
          <div className='flex items-center gap-4'>
            <p className='text-sm text-zinc-500 dark:text-zinc-500'>
              {new Date(photo.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
            <p className='text-sm text-zinc-500 dark:text-zinc-500'>
              {(photo.file_size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
