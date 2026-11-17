import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  demoLogin: (role: 'student' | 'admin' | 'staff') => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fmc_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then(res => {
        setUser(res.user);
      })
      .catch(() => {
        localStorage.removeItem('fmc_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('fmc_token', res.token);
    setUser(res.user);
  };

  const register = async (data: Partial<User> & { password: string }) => {
    const res = await api.register(data);
    localStorage.setItem('fmc_token', res.token);
    setUser(res.user);
  };

  const demoLogin = async (role: 'student' | 'admin' | 'staff') => {
    const res = await api.demoLogin(role);
    localStorage.setItem('fmc_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('fmc_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      demoLogin,
      logout,
      isAdmin,
      isStaff,
      isStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
