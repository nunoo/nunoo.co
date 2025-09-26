export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  cookieOptions,
  DEFAULT_REFRESH_TTL_SECONDS,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 401 }
      );
    }

    // Set cookies for the session
    const c = cookies();
    c.set(COOKIE_ACCESS, data.session.access_token, cookieOptions(3600)); // 1 hour
    c.set(
      COOKIE_REFRESH,
      data.session.refresh_token!,
      cookieOptions(DEFAULT_REFRESH_TTL_SECONDS)
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
