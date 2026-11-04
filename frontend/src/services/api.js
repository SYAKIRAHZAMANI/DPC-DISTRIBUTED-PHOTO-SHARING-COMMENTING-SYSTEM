const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export function getToken() { return localStorage.getItem('moments_token'); }
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  if (!(options.body instanceof FormData) && options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
