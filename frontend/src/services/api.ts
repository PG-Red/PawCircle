/**
 * API 服务层
 * 统一管理所有后端接口调用
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

// 获取 Token
const getToken = () => localStorage.getItem('token');

// 通用请求方法
async function request<T>(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 认证相关 ====================

export const authApi = {
  // 发送邮箱验证码
  sendCode(email: string) {
    return request<null>('POST', '/auth/send-code', { email });
  },

  // 用户注册
  register(username: string, email: string, code: string, password: string) {
    return request<{
      id: number;
      username: string;
      email: string;
      token: string;
    }>('POST', '/auth/register', { username, email, code, password });
  },

  // 用户登录
  login(email: string, password: string) {
    return request<{
      id: number;
      username: string;
      email: string;
      avatar: string;
      token: string;
    }>('POST', '/auth/login', { email, password });
  },
};

// ==================== 宠物档案 ====================

export interface Pet {
  id: number;
  name: string;
  breed: string;
  gender: '弟弟' | '妹妹';
  birthday: string;
  image: string;
  description: string;
  created_at: string;
}

export const petApi = {
  // 获取所有宠物
  getPets() {
    return request<Pet[]>('GET', '/pets');
  },

  // 获取单个宠物
  getPet(petId: number) {
    return request<Pet>('GET', `/pets/${petId}`);
  },

  // 添加宠物
  addPet(data: Omit<Pet, 'id' | 'created_at'>) {
    return request<Pet>('POST', '/pets', data);
  },

  // 编辑宠物
  updatePet(petId: number, data: Partial<Omit<Pet, 'id' | 'created_at'>>) {
    return request<Pet>('PUT', `/pets/${petId}`, data);
  },

  // 删除宠物
  deletePet(petId: number) {
    return request<null>('DELETE', `/pets/${petId}`);
  },
};

// ==================== 动态相关 ====================

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
  created_at: string;
}

export const momentApi = {
  // 获取动态列表
  getMoments(page = 1, pageSize = 10) {
    return request<PaginatedResponse<Moment>>(
      'GET',
      `/moments?page=${page}&pageSize=${pageSize}`
    );
  },

  // 发布动态
  createMoment(data: { pet_id?: number; content: string; image?: string }) {
    return request<Moment>('POST', '/moments', data);
  },

  // 删除动态
  deleteMoment(momentId: number) {
    return request<null>('DELETE', `/moments/${momentId}`);
  },
};

// ==================== 点赞相关 ====================

export const likeApi = {
  // 点赞
  likeMoment(momentId: number) {
    return request<{ likes_count: number }>(
      'POST',
      `/moments/${momentId}/like`
    );
  },

  // 取消点赞
  unlikeMoment(momentId: number) {
    return request<{ likes_count: number }>(
      'DELETE',
      `/moments/${momentId}/like`
    );
  },
};

// ==================== 评论相关 ====================

export interface Comment {
  id: number;
  user: User;
  content: string;
  created_at: string;
}

export const commentApi = {
  // 获取评论列表
  getComments(momentId: number, page = 1, pageSize = 10) {
    return request<PaginatedResponse<Comment>>(
      'GET',
      `/moments/${momentId}/comments?page=${page}&pageSize=${pageSize}`
    );
  },

  // 发布评论
  createComment(momentId: number, content: string) {
    return request<Comment>('POST', `/moments/${momentId}/comments`, {
      content,
    });
  },

  // 删除评论
  deleteComment(momentId: number, commentId: number) {
    return request<null>(
      'DELETE',
      `/moments/${momentId}/comments/${commentId}`
    );
  },
};

// ==================== 喂养记录 ====================

export interface FeedingRecord {
  id: number;
  pet_id: number;
  type: 'Food' | 'Water';
  food_name: string;
  amount: string;
  notes: string;
  created_at: string;
}

export const feedingApi = {
  // 获取喂养记录
  getFeedingRecords(petId: number, page = 1, pageSize = 20) {
    return request<PaginatedResponse<FeedingRecord>>(
      'GET',
      `/pets/${petId}/feeding-records?page=${page}&pageSize=${pageSize}`
    );
  },

  // 添加喂养记录
  addFeedingRecord(
    petId: number,
    data: Omit<FeedingRecord, 'id' | 'pet_id' | 'created_at'>
  ) {
    return request<FeedingRecord>('POST', `/pets/${petId}/feeding-records`, data);
  },

  // 获取今日喂养统计
  getTodayFeeding() {
    return request<
      Array<{
        pet_id: number;
        pet_name: string;
        records: FeedingRecord[];
      }>
    >('GET', '/feeding-records/today');
  },
};

// ==================== 宠物交易 ====================

export interface PetListing {
  id: number;
  seller: User;
  title: string;
  category: 'dog' | 'cat' | 'other';
  description: string;
  price: number;
  image: string;
  location: string;
  status: 'active' | 'sold' | 'closed';
  created_at: string;
}

export const listingApi = {
  // 获取交易列表
  getListings(
    page = 1,
    pageSize = 12,
    category = 'all',
    search = ''
  ) {
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
  },

  // 获取交易详情
  getListing(listingId: number) {
    return request<PetListing>('GET', `/listings/${listingId}`);
  },

  // 发布交易
  createListing(
    data: Omit<PetListing, 'id' | 'seller' | 'status' | 'created_at'>
  ) {
    return request<PetListing>('POST', '/listings', data);
  },

  // 编辑交易
  updateListing(
    listingId: number,
    data: Partial<Omit<PetListing, 'id' | 'seller' | 'created_at'>>
  ) {
    return request<PetListing>('PUT', `/listings/${listingId}`, data);
  },

  // 删除交易
  deleteListing(listingId: number) {
    return request<null>('DELETE', `/listings/${listingId}`);
  },

  // 标记为已售出
  markSold(listingId: number) {
    return request<{ status: string }>(
      'PATCH',
      `/listings/${listingId}/mark-sold`
    );
  },
};

// ==================== AI 助手 ====================

export const aiApi = {
  // 发送消息
  sendMessage(message: string, conversationId?: string) {
    return request<{
      conversation_id: string;
      response: string;
      timestamp: string;
    }>('POST', '/ai/chat', { message, conversation_id: conversationId });
  },

  // 获取对话历史
  getConversation(conversationId: string) {
    return request<{
      id: string;
      messages: Array<{
        role: 'user' | 'ai';
        content: string;
        timestamp: string;
      }>;
    }>('GET', `/ai/conversations/${conversationId}`);
  },
};

// ==================== 用户信息 ====================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  created_at: string;
}

export const userApi = {
  // 获取当前用户信息
  getProfile() {
    return request<UserProfile>('GET', '/users/me');
  },

  // 更新用户信息
  updateProfile(data: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at'>>) {
    return request<UserProfile>('PUT', '/users/me', data);
  },

  // 修改密码
  changePassword(oldPassword: string, newPassword: string) {
    return request<null>('POST', '/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

export default {
  authApi,
  petApi,
  momentApi,
  likeApi,
  commentApi,
  feedingApi,
  listingApi,
  aiApi,
  userApi,
};





