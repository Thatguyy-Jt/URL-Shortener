import axios from 'axios';

export const TOKEN_KEY = 'sniply_token';

export const api = axios.create({
  baseURL: '/api',
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

/** Pull the human-readable message out of an Axios error. */
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message
    );
  }
  return 'An unexpected error occurred.';
}
