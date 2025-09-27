export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for large files

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/client';

// Industry standard: Set max file size limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/bmp',
];

// Industry standard: Validate file metadata
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
    };
  }

  // Get file extension for validation
  const fileExt = file.name.toLowerCase().split('.').pop();
  const isValidExtension = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'heic',
    'heif',
    'tiff',
    'tif',
    'bmp',
  ].includes(fileExt || '');

  // Check MIME type or file extension
  const hasValidMimeType = file.type && ALLOWED_MIME_TYPES.includes(file.type);

  if (!hasValidMimeType && !isValidExtension) {
    return {
      valid: false,
      error:
        'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, HEIC, HEIF, TIFF, BMP',
    };
  }

  return { valid: true };
}

// Industry standard: Generate secure file names
function generateSecureFileName(userId: string, originalName: string): string {
  const fileExt = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${userId}/${timestamp}-${randomString}.${fileExt}`;
}

// Industry standard: Determine content type
function getContentType(fileName: string, fileType?: string): string {
  if (fileType && fileType !== '' && fileType !== 'application/octet-stream') {
    return fileType;
  }

  const ext = fileName.toLowerCase().split('.').pop();
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    bmp: 'image/bmp',
  };

  return mimeMap[ext || ''] || 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Industry standard: Log request metadata for monitoring
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    console.log('Upload request started:', {
      timestamp: new Date().toISOString(),
      isMobile,
      userAgent: userAgent.substring(0, 100),
    });

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const caption = (formData.get('caption') as string) || '';

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate caption length
    if (caption.length > 500) {
      return NextResponse.json(
        { error: 'Caption too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Authentication check
    const cookieStore = cookies();
    const accessToken = cookieStore.get(COOKIE_ACCESS)?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Generate secure file name
    const fileName = generateSecureFileName(user.id, file.name);
    const contentType = getContentType(file.name, file.type);

    // Convert file to ArrayBuffer then Buffer (handles all browsers)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Uploading file:', {
      fileName,
      fileSize: file.size,
      contentType,
      bufferSize: buffer.length,
    });

    // Upload to storage with proper content type
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', {
        error: uploadError,
        fileName,
        fileSize: file.size,
      });

      // Industry standard: Return user-friendly error messages
      const errorMessage = uploadError.message?.includes('row too large')
        ? 'File too large for storage'
        : uploadError.message?.includes('Invalid JWT')
          ? 'Authentication expired, please refresh and try again'
          : uploadError.message || 'Failed to upload file';

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('photos').getPublicUrl(fileName);

    // Save metadata to database
    const photoData = {
      user_id: user.id,
      file_name: file.name,
      storage_path: fileName,
      public_url: publicUrl,
      caption: caption.trim(),
      file_size: file.size,
      mime_type: contentType,
    };

    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert(photoData)
      .select()
      .single();

    if (dbError) {
      // Cleanup uploaded file on database error
      await supabase.storage.from('photos').remove([fileName]);

      console.error('Database error:', {
        error: dbError,
        fileName,
      });

      return NextResponse.json(
        { error: 'Failed to save photo information' },
        { status: 500 }
      );
    }

    // Industry standard: Log successful uploads for monitoring
    const processingTime = Date.now() - startTime;
    console.log('Upload successful:', {
      photoId: photo.id,
      fileName,
      fileSize: file.size,
      processingTimeMs: processingTime,
      isMobile,
    });

    // Return success response
    return NextResponse.json(
      {
        photo,
        message: 'Photo uploaded successfully',
        processingTimeMs: processingTime,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('Photo upload error:', {
      error: error.message || error,
      stack: error.stack,
      processingTimeMs: processingTime,
    });

    // Industry standard: Return appropriate error status codes
    if (error.message?.includes('PayloadTooLargeError')) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Upload timeout - please try again' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
