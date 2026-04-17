import { api } from './api';
import type { ApiResponse, AuthPayload, LoginInput, RegisterInput, User } from '../types';

export const authApi = {
  register: (data: RegisterInput) =>
    api.post<ApiResponse<AuthPayload>>('/auth/register', data).then((r) => r.data.data),

  login: (data: LoginInput) =>
    api.post<ApiResponse<AuthPayload>>('/auth/login', data).then((r) => r.data.data),

  getMe: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/me').then((r) => r.data.data.user),
};
