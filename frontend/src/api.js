import { auth } from './firebase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API}${path}`, { ...options, headers });
}
