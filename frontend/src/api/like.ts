import request from '@/utils/request';
import type { ApiResponse } from './types';

// 点赞
export const likeMomentService = (momentId: number) =>
  request<ApiResponse<{ likes_count: number }>>('POST', `/moments/${momentId}/like`);

// 取消点赞
export const unlikeMomentService = (momentId: number) =>
  request<ApiResponse<{ likes_count: number }>>('DELETE', `/moments/${momentId}/like`);

