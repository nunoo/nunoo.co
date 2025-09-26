import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { PhotoFeed } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true });

    // Get paginated photos (public access - no auth needed)
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const hasMore = (page * limit) < totalCount;

    const feed: PhotoFeed = {
      photos: photos || [],
      page,
      limit,
      total_count: totalCount,
      has_more: hasMore,
    };

    return NextResponse.json(feed, { status: 200 });
  } catch (error) {
    console.error('Photo feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
