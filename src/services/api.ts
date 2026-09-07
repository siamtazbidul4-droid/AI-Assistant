import { User, Conversation, Message, Attachment } from '../types';

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || '';

class ApiError extends Error {
  code?: string;
  statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Token management in-memory with session storage backup
let authToken: string | null = null;
try {
  authToken = sessionStorage.getItem('ai_assistant_token');
} catch (e) {
  // Ignore sessionStorage restriction
}

export function setToken(token: string | null): void {
  authToken = token;
  try {
    if (token) {
      sessionStorage.setItem('ai_assistant_token', token);
    } else {
      sessionStorage.removeItem('ai_assistant_token');
    }
  } catch (e) {}
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    let errorCode = 'REQUEST_FAILED';

    if (isJson) {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
      errorCode = errData.code || errorCode;
    }

    throw new ApiError(errorMsg, errorCode, response.status);
  }

  if (isJson) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as Promise<T>;
}

export const api = {
  // AUTH
  async register(data: { name: string; email: string; password: string; confirmPassword?: string }) {
    const res = await request<{ success: boolean; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setToken(res.token);
    return res;
  },

  async login(data: { email: string; password: string }) {
    const res = await request<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setToken(res.token);
    return res;
  },

  async logout() {
    try {
      await request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },

  async getMe() {
    return request<{ success: boolean; user: User }>('/api/auth/me', { method: 'GET' });
  },

  // CONVERSATIONS
  async getConversations() {
    return request<{ success: boolean; conversations: Conversation[] }>('/api/conversations', { method: 'GET' });
  },

  async getConversation(id: string) {
    return request<{ success: boolean; conversation: Conversation; messages: Message[] }>(`/api/conversations/${id}`, {
      method: 'GET',
    });
  },

  async createConversation(title?: string) {
    return request<{ success: boolean; conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async updateConversation(id: string, title: string) {
    return request<{ success: boolean; conversation: Conversation }>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  async deleteConversation(id: string) {
    return request<{ success: boolean; message: string }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  // FILES
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_BASE}/api/files/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err.message || 'File upload failed', err.code, res.status);
    }

    return res.json() as Promise<{ success: boolean; file: Attachment }>;
  },
};
