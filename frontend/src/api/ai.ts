import request from '@/utils/request';

// 发送消息
export const sendMessageService = (
  message: string,
  conversationId?: string
) =>
  request<{
    conversation_id: string;
    response: string;
    timestamp: string;
  }>('POST', '/ai/chat', { message, conversation_id: conversationId });

// 获取对话历史
export const getConversationService = (conversationId: string) =>
  request<{
    id: string;
    messages: Array<{
      role: 'user' | 'ai';
      content: string;
      timestamp: string;
    }>;
  }>('GET', `/ai/conversations/${conversationId}`);

