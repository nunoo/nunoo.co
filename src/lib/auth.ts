export const COOKIE_ACCESS = 'nunoo_at';
export const COOKIE_REFRESH = 'nunoo_rt';

export function getBackendBaseURL() {
  // Prefer server-side env. For dev fallback to localhost:8080
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    'http://localhost:8080'
  );
}

export function cookieOptions(maxAgeSeconds?: number) {
  const isProd = process.env.NODE_ENV === 'production';
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as 'strict',
    path: '/',
    ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
  };
  return opts;
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer' | string;
  expires_in: number; // seconds
};

export const DEFAULT_REFRESH_TTL_SECONDS = Number(
  process.env.REFRESH_TTL_SECONDS || 72 * 60 * 60
);
