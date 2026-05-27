import request from '../utils/request';
import type { ApiResponse } from './types';

export interface UserProfile {
  id: number;
  user_code: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  show_pets_public: boolean;
  show_pet_details_public: boolean;
  allow_friend_request: boolean;
  chat_permission: 'all' | 'friends_only' | 'none';
  created_at: string;
}

// 获取当前用户信息
export const getProfileService = () =>
  request<ApiResponse<UserProfile>>('GET', '/users/me');

// 更新用户信息
export const updateProfileService = (
  data: Partial<Omit<UserProfile, 'id' | 'user_code' | 'email' | 'created_at'>>
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

// 发送修改密码邮箱验证码（发送到当前登录用户绑定的邮箱）
export const sendChangePwdCodeService = () =>
  request<ApiResponse<null>>('POST', '/users/send-change-password-code', {});

// 通过邮箱验证码修改密码
export const changePasswordByEmailService = (code: string, newPassword: string) =>
  request<ApiResponse<null>>('POST', '/users/change-password-by-email', {
    code,
    new_password: newPassword,
  });

// 搜索用户
export const searchUsersService = (keyword: string, type: 'name' | 'id') =>
  request<ApiResponse<any[]>>('GET', `/users/search?keyword=${encodeURIComponent(keyword)}&type=${type}`);

