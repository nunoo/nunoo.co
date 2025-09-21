import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  cookieOptions,
  getBackendBaseURL,
  DEFAULT_REFRESH_TTL_SECONDS,
} from '@/lib/auth';

export async function POST() {
  const c = cookies();
  const rt = c.get(COOKIE_REFRESH)?.value;
  if (!rt)
    return NextResponse.json(
      { error: 'missing refresh token' },
      { status: 401 }
    );

  const res = await fetch(`${getBackendBaseURL()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !data.access_token) {
    // Clear cookies if refresh invalid
    c.set(COOKIE_ACCESS, '', { ...cookieOptions(0) });
    c.set(COOKIE_REFRESH, '', { ...cookieOptions(0) });
    return NextResponse.json(
      { error: data?.error || 'invalid refresh token' },
      { status: 401 }
    );
  }

  c.set(COOKIE_ACCESS, data.access_token, cookieOptions(data.expires_in));
  // Optionally rotate refresh if returned
  if (data.refresh_token) {
    c.set(
      COOKIE_REFRESH,
      data.refresh_token,
      cookieOptions(DEFAULT_REFRESH_TTL_SECONDS)
    );
  }
  return NextResponse.json({ ok: true });
}
