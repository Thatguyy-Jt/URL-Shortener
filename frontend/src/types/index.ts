// ── Domain models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Link {
  _id: string;
  slug: string;
  originalUrl: string;
  userId: string | null;
  isActive: boolean;
  expiresAt: string | null;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClicksOverTimePoint {
  date: string;   // 'YYYY-MM-DD'
  count: number;  // backend field name is 'count'
}

// Each breakdown uses the exact field names the backend sends
export interface CountryEntry  { country: string; count: number; }
export interface DeviceEntry   { device:  string; count: number; }
export interface BrowserEntry  { browser: string; count: number; }

export interface LinkAnalytics {
  totalClicks:   number;
  uniqueClicks:  number;
  clicksOverTime: ClicksOverTimePoint[];
  countries:  CountryEntry[];   // backend key: 'countries'
  devices:    DeviceEntry[];    // backend key: 'devices'
  browsers:   BrowserEntry[];   // backend key: 'browsers'
}

// ── API response wrappers ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedLinks {
  links: Link[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ── Link mutations ─────────────────────────────────────────────────────────────

export interface CreateLinkInput {
  url: string;
  customSlug?: string;
  expiresAt?: string; // ISO 8601
}
