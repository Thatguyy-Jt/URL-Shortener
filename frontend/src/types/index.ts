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
  clicks: number;
}

export interface BreakdownEntry {
  label: string;
  clicks: number;
}

export interface LinkAnalytics {
  totalClicks: number;
  clicksOverTime: ClicksOverTimePoint[];
  countryBreakdown: BreakdownEntry[];
  deviceBreakdown: BreakdownEntry[];
  browserBreakdown: BreakdownEntry[];
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
