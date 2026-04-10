import request from '@/utils/request';

// 发送邮箱验证码
export const sendCodeService = (email: string) =>
  request<null>('POST', '/auth/send-code', { email });

// 用户注册
export const registerService = (
  username: string,
  email: string,
  code: string,
  password: string
) =>
  request<{ id: number; username: string; email: string; token: string }>(
    'POST',
    '/auth/register',
    { username, email, code, password }
  );

// 用户登录
export const loginService = (email: string, password: string) =>
  request<{
    id: number;
    username: string;
    email: string;
    avatar: string;
    token: string;
  }>('POST', '/auth/login', { email, password });

