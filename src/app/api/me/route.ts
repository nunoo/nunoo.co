import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_ACCESS, getBackendBaseURL } from '@/lib/auth';

async function fetchMe(token: string) {
  const res = await fetch(`${getBackendBaseURL()}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return res;
}

export async function GET(_: NextRequest) {
  const c = cookies();
  const at = c.get(COOKIE_ACCESS)?.value;
  if (!at) return NextResponse.json({ user: null }, { status: 200 });

  let res = await fetchMe(at);
  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/refresh`,
      { method: 'POST', cache: 'no-store' }
    ).catch(() => null);
    if (refreshRes && refreshRes.ok) {
      const at2 = cookies().get(COOKIE_ACCESS)?.value;
      if (at2) res = await fetchMe(at2);
    }
  }
  if (!res.ok) return NextResponse.json({ user: null }, { status: 200 });
  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
