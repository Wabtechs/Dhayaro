const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur réseau' }));
      throw new Error(error.detail || `Erreur ${response.status}`);
    }
    return response.json();
  }

  login(email: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  refreshToken(refreshToken: string) {
    return this.request<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  getMe(token: string) {
    return this.request<unknown>('/auth/me', { token });
  }

  get<T>(endpoint: string, token: string) {
    return this.request<T>(endpoint, { token });
  }

  post<T>(endpoint: string, body: unknown, token: string) {
    return this.request<T>(endpoint, { method: 'POST', body, token });
  }

  put<T>(endpoint: string, body: unknown, token: string) {
    return this.request<T>(endpoint, { method: 'PUT', body, token });
  }

  delete<T>(endpoint: string, token: string) {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_BASE);
