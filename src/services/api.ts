const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

type TokenListener = (token: string) => void;

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string> | null = null;
  private onTokenRefreshed: TokenListener | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenListener(listener: TokenListener) {
    this.onTokenRefreshed = listener;
  }

  private getToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('dhayaro_token') || '';
  }

  private getRefreshToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('dhayaro_refresh_token') || '';
  }

  private async doRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) throw new Error('Refresh failed');

    const data = await response.json();
    const newToken: string = data.access_token;

    localStorage.setItem('dhayaro_token', newToken);
    document.cookie = `dhayaro_token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
    this.onTokenRefreshed?.(newToken);

    return newToken;
  }

  private async requestWithAuth<T>(endpoint: string, options: ApiOptions = {}, retry = true): Promise<T> {
    const { method = 'GET', body, token } = options;
    const authToken = token || this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && retry && this.getRefreshToken()) {
      try {
        if (!this.refreshPromise) {
          this.refreshPromise = this.doRefresh();
        }
        const newToken = await this.refreshPromise;
        this.refreshPromise = null;
        return this.requestWithAuth<T>(endpoint, { ...options, token: newToken }, false);
      } catch {
        this.refreshPromise = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dhayaro_token');
          localStorage.removeItem('dhayaro_refresh_token');
          localStorage.removeItem('dhayaro_user');
          document.cookie = 'dhayaro_token=; path=/; max-age=0';
          window.location.href = '/login';
        }
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur réseau' }));
      throw new Error(error.detail || `Erreur ${response.status}`);
    }
    return response.json();
  }

  login(email: string, password: string) {
    return this.requestWithAuth<{ access_token: string; refresh_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }, false);
  }

  refreshToken(refreshToken: string) {
    return this.requestWithAuth<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    }, false);
  }

  getMe(token: string) {
    return this.requestWithAuth<unknown>('/auth/me', { token });
  }

  get<T>(endpoint: string, token: string) {
    return this.requestWithAuth<T>(endpoint, { token });
  }

  post<T>(endpoint: string, body: unknown, token: string) {
    return this.requestWithAuth<T>(endpoint, { method: 'POST', body, token });
  }

  put<T>(endpoint: string, body: unknown, token: string) {
    return this.requestWithAuth<T>(endpoint, { method: 'PUT', body, token });
  }

  delete<T>(endpoint: string, token: string) {
    return this.requestWithAuth<T>(endpoint, { method: 'DELETE', token });
  }
}

export const api = new ApiClient(API_BASE);
