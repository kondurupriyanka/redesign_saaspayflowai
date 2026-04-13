import { supabase } from '@/lib/supabase';

// Always use relative /api path so Vite proxy forwards to Express (port 3001).
// Never use an absolute URL here — it bypasses the proxy and hits a dead port.
const API_BASE = '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function getValidToken(): Promise<string> {
  let { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to perform this action.');
  }

  // Check if token expires within the next 60 seconds
  const expiresAt = session.expires_at ?? 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isExpiringSoon = expiresAt - nowSeconds < 60;

  if (isExpiringSoon) {
    console.log('[auth] Token expiring soon — refreshing…');
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session) {
      console.warn('[auth] Token refresh failed:', error?.message);
      throw new Error('Session expired. Please sign in again.');
    }
    session = refreshed.session;
    console.log('[auth] Token refreshed. New expiry:', new Date((session.expires_at ?? 0) * 1000).toISOString());
  }

  const token = session.access_token;
  const expiryDate = new Date(expiresAt * 1000).toISOString();
  console.log('[auth] Token present — user_id:', session.user.id, '| expires:', expiryDate);

  return token;
}

export async function apiRequest<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const token = await getValidToken();

  const url = `${API_BASE}${path}`;
  console.log(`[apiRequest] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // On 401, try one token refresh and retry
  if (response.status === 401) {
    console.warn('[apiRequest] Got 401 — attempting token refresh and retry…');
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session) {
      throw new Error('Session expired. Please sign in again.');
    }
    const retryResponse = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshed.session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const retryPayload = await retryResponse.json().catch(() => ({}));
    if (!retryResponse.ok) {
      throw new Error(retryPayload?.error || `Request failed (${retryResponse.status})`);
    }
    return retryPayload as T;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload as T;
}
