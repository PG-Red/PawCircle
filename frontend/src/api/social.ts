import request from '@/utils/request';
import type { ApiResponse, PaginatedResponse } from './types';

export interface PublicPetSummary {
  id: number;
  name: string;
  image?: string;
}

export interface PublicPetDetail extends PublicPetSummary {
  breed: string;
  gender: '弟弟' | '妹妹';
  birthday: string;
  description: string;
  created_at: string;
}

export interface PublicUserProfile {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  created_at: string;
  show_pets_public: boolean;
  show_pet_details_public: boolean;
  friend_status: 'self' | 'none' | 'pending_sent' | 'pending_received' | 'friends';
  pets: Array<PublicPetSummary | PublicPetDetail>;
}

export interface FriendRequest {
  id: number;
  message?: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
    avatar: string;
  };
}

export interface FriendItem {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  friend_since: string;
  unread_count: number;
  last_message?: string;
  last_message_time?: string;
  is_friend?: number; // 1为好友 0为临时会话
}

export interface ConversationItem {
  friend: {
    id: number;
    username: string;
    avatar: string;
  };
  last_message?: string;
  last_message_time?: string;
}

export interface PrivateMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export const getPublicUserProfileService = (userId: number) =>
  request<ApiResponse<PublicUserProfile>>('GET', `/users/public/${userId}`);

export const sendFriendRequestService = (receiverId: number, message?: string) =>
  request<ApiResponse<{ id: number }>>('POST', '/social/requests', {
    receiver_id: receiverId,
    message,
  });

export const getPendingFriendRequestsService = () =>
  request<ApiResponse<FriendRequest[]>>('GET', '/social/requests/pending');

export const acceptFriendRequestService = (requestId: number) =>
  request<ApiResponse<null>>('POST', `/social/requests/${requestId}/accept`);

export const rejectFriendRequestService = (requestId: number) =>
  request<ApiResponse<null>>('POST', `/social/requests/${requestId}/reject`);

export const getFriendsService = () =>
  request<ApiResponse<FriendItem[]>>('GET', '/social/friends');

export const getConversationsService = () =>
  request<ApiResponse<ConversationItem[]>>('GET', '/social/conversations');

export const getMessagesWithFriendService = (friendId: number, page = 1, pageSize = 30) =>
  request<ApiResponse<PaginatedResponse<PrivateMessage>>>(
    'GET',
    `/social/messages/${friendId}?page=${page}&pageSize=${pageSize}`
  );

export const sendMessageToFriendService = (friendId: number, content: string) =>
  request<ApiResponse<PrivateMessage>>('POST', `/social/messages/${friendId}`, { content });

export const markMessagesAsReadService = (friendId: number) =>
  request<ApiResponse<null>>('POST', `/social/messages/${friendId}/read`);

