'use client';

import { useEffect, useState } from 'react';

type MeResponse = { user: { id: string; email: string } | null };

export function useMe() {
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        setLoading(true);
        const res = await fetch('/api/me', { cache: 'no-store' });
        const data: MeResponse = await res.json();
        if (!active) return;
        setUser(data.user ?? null);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Failed to load user');
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);

  return { user, loading, error };
}
