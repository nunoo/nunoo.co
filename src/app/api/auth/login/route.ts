import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  cookieOptions,
  getBackendBaseURL,
  TokenResponse,
  DEFAULT_REFRESH_TTL_SECONDS,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: 'email and password required' },
      { status: 400 }
    );
  }

  const res = await fetch(`${getBackendBaseURL()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
    // Prevent Next from caching auth responses
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as Partial<TokenResponse> &
    { error?: string };
  if (!res.ok || !data.access_token || !data.refresh_token) {
    return NextResponse.json(
      { error: data?.error || 'invalid credentials' },
      { status: res.status || 401 }
    );
  }

  const c = cookies();
  c.set(COOKIE_ACCESS, data.access_token, cookieOptions(data.expires_in));
  c.set(
    COOKIE_REFRESH,
    data.refresh_token,
    cookieOptions(DEFAULT_REFRESH_TTL_SECONDS)
  );

  return NextResponse.json({ ok: true });
}
