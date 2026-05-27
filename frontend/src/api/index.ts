/**
 * api/index.ts
 * 统一导出所有 API 模块，并保持与原 services/api.ts 相同的对象结构，
 * 保证所有已有页面无需修改即可正常运行。
 */

// ---- 类型重导出 ----
export type { Pet } from './pet';
export type { User, Moment } from './moment';
export type { Comment } from './comment';
export type { UserProfile } from './user';
export type {
  PublicUserProfile,
  FriendRequest,
  FriendItem,
  ConversationItem,
  PrivateMessage,
} from './social';
export type { ApiResponse, PaginatedResponse } from './types';

// ---- 各模块 service 函数重导出 ----
export * from './auth';
export * from './pet';
export * from './moment';
export * from './like';
export * from './comment';
export * from './ai';
export * from './user';
export * from './social';

// ---- 兼容原 services/api.ts 的对象风格导出 ----
import { sendCodeService, getCaptchaService, sendLoginCodeService, registerService, loginService } from './auth';
import { getPetsService, getPetService, addPetService, updatePetService, deletePetService, getRoutinesService, addRoutineService, updateRoutineService, deleteRoutineService, getRoutineRecordsService, toggleRoutineRecordService } from './pet';
import { getMomentsService, createMomentService, deleteMomentService, getMomentByIdService } from './moment';
import { likeMomentService, unlikeMomentService } from './like';
import { getCommentsService, createCommentService, deleteCommentService, getMyCommentsService } from './comment';
import { sendMessageService, getConversationService } from './ai';
import { getProfileService, updateProfileService, changePasswordService, sendChangePwdCodeService, changePasswordByEmailService, searchUsersService } from './user';
import {
  getPublicUserProfileService,
  sendFriendRequestService,
  getPendingFriendRequestsService,
  acceptFriendRequestService,
  rejectFriendRequestService,
  getFriendsService,
  getConversationsService,
  getMessagesWithFriendService,
  sendMessageToFriendService,
  markMessagesAsReadService,
  getUnreadSummaryService,
} from './social';

// 认证模块：发送验证码、注册、登录
export const authApi = {
  sendCode: sendCodeService,          // POST /auth/send-code
  getCaptcha: getCaptchaService,      // GET  /auth/captcha
  sendLoginCode: sendLoginCodeService, // POST /auth/send-login-code
  register: registerService,          // POST /auth/register
  login: loginService,                // POST /auth/login
};

// 宠物模块：宠物档案的增删改查及打卡活动
export const petApi = {
  getPets: getPetsService,       // GET    /pets
  getPet: getPetService,         // GET    /pets/:id
  addPet: addPetService,         // POST   /pets
  updatePet: updatePetService,   // PUT    /pets/:id
  deletePet: deletePetService,   // DELETE /pets/:id
  getRoutines: getRoutinesService,
  addRoutine: addRoutineService,
  updateRoutine: updateRoutineService,
  deleteRoutine: deleteRoutineService,
  getRoutineRecords: getRoutineRecordsService,
  toggleRoutineRecord: toggleRoutineRecordService,
};

// 动态模块：获取/发布/删除朋友圈动态
export const momentApi = {
  getMoments: getMomentsService,           // GET    /moments
  createMoment: createMomentService,       // POST   /moments
  deleteMoment: deleteMomentService,       // DELETE /moments/:id
  getMomentById: getMomentByIdService,     // GET    /moments/public/:id
};

// 点赞模块：动态点赞与取消点赞
export const likeApi = {
  likeMoment: likeMomentService,     // POST   /moments/:id/like
  unlikeMoment: unlikeMomentService, // DELETE /moments/:id/like
};

// 评论模块：获取/发布/删除评论
export const commentApi = {
  getComments: getCommentsService,       // GET    /moments/:id/comments
  createComment: createCommentService,   // POST   /moments/:id/comments
  deleteComment: deleteCommentService,   // DELETE /moments/:id/comments/:commentId
  getMyComments: getMyCommentsService,   // GET    /moments/my-comments
};

// AI 助手模块：发送消息及获取对话历史
export const aiApi = {
  sendMessage: sendMessageService,           // POST /ai/chat
  getConversation: getConversationService,   // GET  /ai/conversations/:id
};

// 用户模块：获取/更新个人资料、修改密码
export const userApi = {
  getProfile: getProfileService,                         // GET  /users/me
  updateProfile: updateProfileService,                   // PUT  /users/me
  changePassword: changePasswordService,                 // POST /users/change-password
  sendChangePwdCode: sendChangePwdCodeService,           // POST /users/send-change-password-code
  changePasswordByEmail: changePasswordByEmailService,   // POST /users/change-password-by-email
  getPublicProfile: getPublicUserProfileService,         // GET /users/public/:id
  searchUsers: searchUsersService,                       // GET /users/search
};

// 社交模块：好友申请、好友列表与私聊
export const socialApi = {
  getUnreadSummary: getUnreadSummaryService,
  sendFriendRequest: sendFriendRequestService,
  getPendingRequests: getPendingFriendRequestsService,
  acceptFriendRequest: acceptFriendRequestService,
  rejectFriendRequest: rejectFriendRequestService,
  getFriends: getFriendsService,
  getConversations: getConversationsService,
  getMessagesWithFriend: getMessagesWithFriendService,
  sendMessageToFriend: sendMessageToFriendService,
  markMessagesAsRead: markMessagesAsReadService,
};

export default {
  authApi,
  petApi,
  momentApi,
  likeApi,
  commentApi,
  aiApi,
  userApi,
  socialApi,
};

