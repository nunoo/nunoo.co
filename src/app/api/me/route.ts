import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/client';

// Mark this route as dynamic since it uses cookies
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest) {
  try {
    const c = cookies();
    const accessToken = c.get(COOKIE_ACCESS)?.value;

    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const supabase = createServerSupabaseClient();

    // Get user from access token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
