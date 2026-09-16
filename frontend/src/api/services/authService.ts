import api from '../client';
import type { LoginRequest, LoginResponse } from '@/types/api';

export const authService = {
  login(data: LoginRequest) {
    return api.post<LoginResponse>('/auth/login', data).then((r) => r.data);
  },
};
