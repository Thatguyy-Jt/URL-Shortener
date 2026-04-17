import { api } from './api';
import type {
  ApiResponse,
  CreateLinkInput,
  Link,
  LinkAnalytics,
  PaginatedLinks,
} from '../types';

export const linksApi = {
  /** Paginated list of the current user's links */
  list: (page = 1, limit = 20) =>
    api
      .get<ApiResponse<PaginatedLinks>>('/links', { params: { page, limit } })
      .then((r) => r.data.data),

  /** Single link by id */
  getById: (id: string) =>
    api.get<ApiResponse<Link>>(`/links/${id}`).then((r) => r.data.data),

  /** Create a short link (authenticated or anonymous) */
  create: (data: CreateLinkInput) =>
    api.post<ApiResponse<Link>>('/links', data).then((r) => r.data.data),

  /** Soft-delete (deactivate) */
  deactivate: (id: string) =>
    api.patch<ApiResponse<Link>>(`/links/${id}/deactivate`).then((r) => r.data.data),

  /** Hard delete */
  remove: (id: string) => api.delete(`/links/${id}`),

  /** Update expiry date; pass null to clear */
  updateExpiry: (id: string, expiresAt: string | null) =>
    api
      .patch<ApiResponse<Link>>(`/links/${id}/expiry`, { expiresAt })
      .then((r) => r.data.data),

  /** Full analytics for a link */
  analytics: (id: string) =>
    api
      .get<ApiResponse<LinkAnalytics>>(`/links/${id}/analytics`)
      .then((r) => r.data.data),
};
