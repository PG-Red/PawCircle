import request from '../utils/request';
import type { ApiResponse } from './types';

export interface CaptchaPayload {
  captchaId: string;
  captchaSvg: string;
  expiresIn: number;
}

// 发送邮箱验证码
export const sendCodeService = (email: string) =>
  request<ApiResponse<null>>('POST', '/auth/send-code', { email });

// 获取登录图形验证码
export const getCaptchaService = () =>
  request<ApiResponse<CaptchaPayload>>('GET', '/auth/captcha');

// 发送登录验证码
export const sendLoginCodeService = (email: string) =>
  request<ApiResponse<null>>('POST', '/auth/send-login-code', { email });

// 用户注册
export const registerService = (
  username: string,
  email: string,
  code: string,
  password: string
) =>
  request<ApiResponse<{ id: number; user_code: string; username: string; email: string; token: string }>>(
    'POST',
    '/auth/register',
    { username, email, code, password }
  );

// 用户登录
export const loginService = (
  email: string,
  password?: string,
  code?: string,
  captchaId?: string,
  captchaCode?: string
) =>
  request<ApiResponse<{
    id: number;
    user_code: string;
    username: string;
    email: string;
    avatar: string;
    token: string;
  }>>('POST', '/auth/login', { email, password, code, captchaId, captchaCode });

