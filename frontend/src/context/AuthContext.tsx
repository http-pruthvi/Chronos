import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export interface DecodedUser {
  id: string; // User ID
  email: string;
  role: string; // ADMIN, HR, MANAGER, EMPLOYEE
  permissions: string[]; // List of permission codes
  employeeId: string | null;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: DecodedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = api.getAccessToken();
    if (token) {
      const claims = parseJwt(token);
      if (claims && claims.exp * 1000 > Date.now()) {
        setUser({
          id: claims.id,
          email: claims.email,
          role: claims.role,
          permissions: claims.permissions || [],
          employeeId: claims.employeeId,
          firstName: claims.firstName,
          lastName: claims.lastName,
        });
      } else {
        api.clearTokens();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    const { accessToken, refreshToken, user: userProfile } = response;
    
    api.setTokens(accessToken, refreshToken);
    
    const claims = parseJwt(accessToken);
    setUser({
      id: claims.id,
      email: claims.email,
      role: claims.role,
      permissions: claims.permissions || [],
      employeeId: claims.employeeId,
      firstName: userProfile.firstName || claims.firstName || '',
      lastName: userProfile.lastName || claims.lastName || '',
    });
  };

  const logout = async () => {
    try {
      const rt = api.getRefreshToken();
      if (rt) {
        await api.post('/api/v1/auth/logout', { refreshToken: rt });
      }
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      api.clearTokens();
      setUser(null);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    // Admins bypass all permission checks
    if (user.role === 'ADMIN') return true;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
