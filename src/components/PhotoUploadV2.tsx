'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/Button';

interface PhotoUploadProps {
  onUploadSuccess?: (photo: any) => void;
  onUploadError?: (error: string) => void;
}

interface UploadOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType?: string;
}

export function PhotoUploadV2({
  onUploadSuccess,
  onUploadError,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry standard: Convert HEIC/HEIF to JPEG
  const convertHeicToJpeg = async (file: File): Promise<Blob> => {
    // Only run in browser
    if (typeof window === 'undefined') {
      throw new Error('HEIC conversion only available in browser');
    }

    try {
      setProcessingStatus('Converting HEIC/HEIF image...');

      // Dynamic import to prevent SSR issues
      const heic2any = (await import('heic2any')).default;

      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      return Array.isArray(blob) ? blob[0] : blob;
    } catch (error) {
      console.error('HEIC conversion error:', error);
      throw new Error('Failed to convert HEIC/HEIF image');
    }
  };

  // Industry standard: Compress and optimize images client-side
  const processImage = async (file: File): Promise<File> => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return file;
    }

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isHeic = fileExtension === 'heic' || fileExtension === 'heif';

    let processedFile = file;

    // Convert HEIC/HEIF to JPEG first
    if (isHeic) {
      try {
        const jpegBlob = await convertHeicToJpeg(file);
        const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        processedFile = new File([jpegBlob], fileName, { type: 'image/jpeg' });
      } catch (error) {
        // Fallback: proceed with original file
        console.warn('HEIC conversion failed, using original:', error);
      }
    }

    // Compression options
    const options: UploadOptions = {
      maxSizeMB: 5, // Compress to max 5MB
      maxWidthOrHeight: 2048, // Max dimension 2048px
      useWebWorker: true,
      fileType: processedFile.type || 'image/jpeg',
    };

    try {
      setProcessingStatus('Optimizing image for upload...');

      // Dynamic import to prevent SSR issues
      const imageCompression = (await import('browser-image-compression'))
        .default;

      const compressedFile = await imageCompression(processedFile, options);

      // Ensure the file has proper type metadata
      return new File([compressedFile], processedFile.name, {
        type: compressedFile.type || 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Image compression error:', error);
      // Fallback to original file if compression fails
      return processedFile;
    }
  };

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

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/bmp',
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isHeicFile = fileExtension === 'heic' || fileExtension === 'heif';

    if (!allowedTypes.includes(file.type) && !isHeicFile && file.type !== '') {
      onUploadError?.(
        'Please select a valid image file (JPEG, PNG, WebP, GIF, HEIC, HEIF, TIFF, BMP)'
      );
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      onUploadError?.('File size must be less than 100MB');
      return;
    }

    setProcessingStatus('Processing image...');

    try {
      // Process the image (convert HEIC, compress, etc.)
      const processedFile = await processImage(file);
      setSelectedFile(processedFile);

      // Create preview URL
      const url = URL.createObjectURL(processedFile);
      setPreviewUrl(url);
      setProcessingStatus('');
      setUploadProgress(0);
    } catch (error: any) {
      onUploadError?.(error.message || 'Failed to process image');
      setProcessingStatus('');
    }
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
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      // Industry standard: Use fetch with proper error handling
      const response = await fetch('/api/photos/upload-v2', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Upload failed with status ${response.status}`
        );
      }

      const data = await response.json();
      onUploadSuccess?.(data.photo);

      // Cleanup
      resetUpload();
    } catch (error: any) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const errorMessage =
        isMobile && error.message.includes('Network')
          ? 'Network error - please check your connection and try again'
          : error.message || 'Upload failed';

      onUploadError?.(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = useCallback(() => {
    setSelectedFile(null);
    setCaption('');
    setUploadProgress(0);
    setProcessingStatus('');

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
            accept='image/*,.heic,.heif'
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
                All image formats supported • Automatically optimized
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {processingStatus && (
            <div className='rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'>
              {processingStatus}
            </div>
          )}

          <div className='relative'>
            {previewUrl && (
              <Image
                src={previewUrl}
                alt='Selected'
                width={400}
                height={192}
                className='h-48 w-full rounded-lg object-cover'
                unoptimized
              />
            )}
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
              disabled={isUploading || !!processingStatus}
              className='flex-1'
            >
              {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Photo'}
            </Button>
            <Button
              onClick={resetUpload}
              variant='secondary'
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>

          {selectedFile && (
            <div className='text-xs text-zinc-500 dark:text-zinc-400'>
              File size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              {selectedFile.size < 5 * 1024 * 1024 && ' (Optimized)'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
