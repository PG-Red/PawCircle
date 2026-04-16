import request from '@/utils/request';
import type { PaginatedResponse } from './types';
import type { User } from './moment';

export interface PetListing {
  id: number;
  seller: User;
  title: string;
  category: 'dog' | 'cat' | 'other';
  description: string;
  price: number;
  image: string;
  location: string;
  seller_intro?: string;
  status: 'active' | 'sold' | 'closed';
  created_at: string;
}

// 获取交易列表
export const getListingsService = (
  page = 1,
  pageSize = 12,
  category = 'all',
  search = ''
) => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    category,
    search,
  });
  return request<PaginatedResponse<PetListing>>(
    'GET',
    `/listings?${params.toString()}`
  );
};

// 获取交易详情
export const getListingService = (listingId: number) =>
  request<PetListing>('GET', `/listings/${listingId}`);

// 发布交易
export const createListingService = (
  data: Omit<PetListing, 'id' | 'seller' | 'status' | 'created_at'>
) => request<PetListing>('POST', '/listings', data);

// 编辑交易
export const updateListingService = (
  listingId: number,
  data: Partial<Omit<PetListing, 'id' | 'seller' | 'created_at'>>
) => request<PetListing>('PUT', `/listings/${listingId}`, data);

// 删除交易
export const deleteListingService = (listingId: number) =>
  request<null>('DELETE', `/listings/${listingId}`);

// 标记为已售出
export const markSoldService = (listingId: number) =>
  request<{ status: string }>('PATCH', `/listings/${listingId}/mark-sold`);

