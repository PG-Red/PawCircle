import request from '@/utils/request';
import type { PaginatedResponse } from './types';
import type { User } from './moment';

export interface Comment {
  id: number;
  user: User;
  content: string;
  created_at: string;
  moment_id?: number;
  moment_content?: string;
}

// 获取评论列表
export const getCommentsService = (
  momentId: number,
  page = 1,
  pageSize = 10
) =>
  request<PaginatedResponse<Comment>>(
    'GET',
    `/moments/${momentId}/comments?page=${page}&pageSize=${pageSize}`
  );

// 获取当前用户的所有评论
export const getMyCommentsService = () =>
  request<{ items: Comment[] }>('GET', '/moments/my-comments');

// 发布评论
export const createCommentService = (momentId: number, content: string) =>
  request<Comment>('POST', `/moments/${momentId}/comments`, { content });

// 删除评论
export const deleteCommentService = (momentId: number, commentId: number) =>
  request<null>('DELETE', `/moments/${momentId}/comments/${commentId}`);

