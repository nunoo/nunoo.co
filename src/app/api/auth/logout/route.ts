export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS, COOKIE_REFRESH, cookieOptions } from '@/lib/auth';

export async function POST() {
  const c = cookies();
  // Clear cookies by setting empty and maxAge 0
  c.set(COOKIE_ACCESS, '', { ...cookieOptions(0) });
  c.set(COOKIE_REFRESH, '', { ...cookieOptions(0) });
  return NextResponse.json({ ok: true });
}
