import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export type UserRole = 'volunteer' | 'org_admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  onboardingCompleted: boolean;
  fullName?: string;
  phone?: string;
  bio?: string;
  skills?: string;
  needsPasswordReset: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: (data?: { token: string; user: User }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('vms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('vms_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('vms_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Auth check failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const updateAuth = (token: string, user: User) => {
    localStorage.setItem('vms_token', token);
    localStorage.setItem('vms_user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    updateAuth(res.data.token, res.data.user);
  };

  const register = async (email: string, password: string, role: UserRole = 'volunteer') => {
    const res = await api.post('/auth/register', { email, password, role });
    updateAuth(res.data.token, res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    setUser(null);
  };

  const refreshUser = async (data?: { token: string; user: User }) => {
    if (data) {
      updateAuth(data.token, data.user);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('vms_user', JSON.stringify(res.data));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
