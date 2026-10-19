import { auth } from './firebase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Lightweight in-memory client cache with TTL
const cache = new Map();
const DEFAULT_TTL_MS = 15000; // 15 seconds

export async function apiFetch(path, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const skipCache = !!options.skipCache;
  const now = Date.now();

  if (isGet && !skipCache) {
    const cached = cache.get(path);
    if (cached && now - cached.timestamp < (options.ttl || DEFAULT_TTL_MS)) {
      return cached.response.clone();
    }
  }

  let token = null;
  try {
    if (auth?.currentUser) {
      token = await auth.currentUser.getIdToken(false);
    }
  } catch {}
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('cti_auth_token');
  }
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API}${path}`, { ...options, headers });

  if (isGet && response.ok) {
    cache.set(path, {
      response: response.clone(),
      timestamp: now,
    });
  } else if (!isGet) {
    // Invalidate caches when mutations occur
    cache.clear();
  }

  return response;
}

export function clearApiCache() {
  cache.clear();
}
