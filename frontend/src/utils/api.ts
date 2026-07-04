export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, { ...options, headers });

    // Handle Token Expiration and Automatic Refresh Rotation
    if (response.status === 401 && this.refreshToken) {
      try {
        const refreshResponse = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          this.setTokens(data.data.accessToken, data.data.refreshToken);

          // Retry the original request with the new access token
          headers.set('Authorization', `Bearer ${this.accessToken}`);
          const retryResponse = await fetch(path, { ...options, headers });
          
          if (!retryResponse.ok) {
            const errBody = await retryResponse.json().catch(() => ({}));
            throw errBody;
          }
          return retryResponse.json().then(res => res.data ?? res);
        } else {
          // Refresh token invalid/expired: log user out
          this.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      } catch (err) {
        this.clearTokens();
        window.location.href = '/login';
        throw err;
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw errBody;
    }

    // Standard JSON output conversion
    const data = await response.json().catch(() => ({}));
    return data.data !== undefined ? data.data : data;
  }

  async get<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T = any>(path: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(path: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(path: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiService();
export default api;
