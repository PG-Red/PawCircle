import request from '../utils/request';
import type { ApiResponse } from './types';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  show_pets_public: boolean;
  show_pet_details_public: boolean;
  created_at: string;
}

// 获取当前用户信息
export const getProfileService = () =>
  request<ApiResponse<UserProfile>>('GET', '/users/me');

// 更新用户信息
export const updateProfileService = (
  data: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at'>>
) => request<ApiResponse<UserProfile>>('PUT', '/users/me', data);

// 修改密码
export const changePasswordService = (
  oldPassword: string,
  newPassword: string
) =>
  request<ApiResponse<null>>('POST', '/users/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });

