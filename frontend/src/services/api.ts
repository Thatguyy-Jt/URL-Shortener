import axios from 'axios';

export const TOKEN_KEY = 'sniply_token';

// In development, Vite proxies /api → localhost:5000 so we use a relative path.
// In production (or when VITE_API_URL is set), we call the backend directly.
const API_BASE = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Avoid redirect loop on the login page itself
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Pull the human-readable message out of an Axios error.
 *  Backend shape: { success: false, error: { message: string } }
 */
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    return (
      data?.error?.message ??          // { error: { message: "..." } }  ← our backend
      data?.message ??                  // { message: "..." }              ← flat shape
      (typeof data?.error === 'string' ? data.error : undefined) ??
      err.message
    );
  }
  return 'An unexpected error occurred.';
}
