/**
 * request.ts
 * 统一请求工具，基于 fetch 封装，含 token 注入、401 拦截
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('token');

export class RequestError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.data = data;
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

async function request<T = any>(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
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

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `HTTP ${response.status}`;

    if (response.status === 401) {
      localStorage.removeItem('token');
      if (!endpoint.startsWith('/auth/')) {
      window.location.href = '/auth';
    }
    }

    throw new RequestError(response.status, message, body);
  }

  return body as T;
}

export default request;
export { BASE_URL };
