import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import api from '../services/api';
import { setAccessToken, clearTokens, getAccessToken } from '../services/authTokens';

interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const { data } = await api.get('/users/profile');
          setUser(data.data);
          console.log('USER: ', data);
        } catch (error) {
          clearTokens();
        }
      }
      setIsLoading(false);
    }
    initializeAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    const { data } = await api.post('/auth/login', {
      phone,
      password
    });

    console.log('DATA: ', data);
    
    const { accessToken, refreshToken, user: userData } = data.data;
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    console.log('USER: ', user);
    return data;
  };

  const register = async (payload: {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const { data } = await api.post('/auth/register', payload);
    
    const { accessToken, refreshToken, user: userData } = data.data;
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    clearTokens();
    setUser(null);
    
    window.location.href = '/login';
  };

  const isAuthenticated = !!user;
  console.log('Authenticated: ', isAuthenticated, user);

  const value = useMemo(() => {
    return {
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout
    };
  }, [user, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
