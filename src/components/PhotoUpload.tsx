'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/Button';

interface PhotoUploadProps {
  onUploadSuccess?: (photo: any) => void;
  onUploadError?: (error: string) => void;
}

export function PhotoUpload({
  onUploadSuccess,
  onUploadError,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.(
        'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
      );
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      onUploadError?.('File size must be less than 20MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onUploadSuccess?.(data.photo);

      setSelectedFile(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className='mx-auto w-full max-w-md'>
      {!selectedFile ? (
        <div
          className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragActive
              ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
              : 'border-zinc-300 hover:border-teal-400 dark:border-zinc-600 dark:hover:border-teal-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type='file'
            className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
            accept='image/*'
            onChange={handleFileInputChange}
          />
          <div className='space-y-4'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
              <svg
                className='h-6 w-6 text-zinc-400'
                fill='none'
                strokeWidth='1.5'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
                />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                Drop your photo here, or click to browse
              </p>
              <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
                JPEG, PNG, WebP, or GIF up to 20MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='relative'>
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt='Selected'
              width={400}
              height={192}
              className='h-48 w-full rounded-lg object-cover'
              unoptimized
            />
            <button
              onClick={resetUpload}
              className='absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70'
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

          <div>
            <label className='mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100'>
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder='Add a caption for your photo...'
              className='w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
              rows={3}
              maxLength={500}
            />
            <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
              {caption.length}/500 characters
            </p>
          </div>

          <div className='flex gap-3'>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className='flex-1'
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <Button
              onClick={resetUpload}
              variant='secondary'
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
