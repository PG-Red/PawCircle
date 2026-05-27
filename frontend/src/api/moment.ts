import request from '@/utils/request';
import type { ApiResponse, PaginatedResponse } from './types';

export interface User {
  id: number;
  username: string;
  avatar: string;
  email?: string;
}

export interface Moment {
  id: number;
  user: User;
  pet?: { id: number; name: string };
  content: string;
  image: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_commented?: boolean;
  created_at: string;
}

// 获取动态列表
export const getMomentsService = (page = 1, pageSize = 10, filter: 'all' | 'friends' = 'all') =>
  request<ApiResponse<PaginatedResponse<Moment>>>(
    'GET',
    `/moments?page=${page}&pageSize=${pageSize}&filter=${filter}`
  );

// 发布动态
export const createMomentService = (data: {
  pet_id?: number;
  content: string;
  image?: string;
}) => request<ApiResponse<Moment>>('POST', '/moments', data);

// 删除动态
export const deleteMomentService = (momentId: number) =>
  request<ApiResponse<null>>('DELETE', `/moments/${momentId}`);

// 获取单条动态（公开，分享链接用）
export const getMomentByIdService = (momentId: number) =>
  request<ApiResponse<Moment>>('GET', `/moments/public/${momentId}`);

