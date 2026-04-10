import request from '@/utils/request';
import type { PaginatedResponse } from './types';

export interface FeedingRecord {
  id: number;
  pet_id: number;
  type: 'Food' | 'Water';
  food_name: string;
  amount: string;
  notes: string;
  created_at: string;
}

// 获取喂养记录
export const getFeedingRecordsService = (
  petId: number,
  page = 1,
  pageSize = 20
) =>
  request<PaginatedResponse<FeedingRecord>>(
    'GET',
    `/pets/${petId}/feeding-records?page=${page}&pageSize=${pageSize}`
  );

// 添加喂养记录
export const addFeedingRecordService = (
  petId: number,
  data: Omit<FeedingRecord, 'id' | 'pet_id' | 'created_at'>
) =>
  request<FeedingRecord>('POST', `/pets/${petId}/feeding-records`, data);

// 获取今日喂养统计
export const getTodayFeedingService = () =>
  request<Array<{ pet_id: number; pet_name: string; records: FeedingRecord[] }>>(
    'GET',
    '/feeding-records/today'
  );

