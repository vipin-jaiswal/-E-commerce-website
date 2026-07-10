import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false); // No initial loading without backend

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (credentials) => {
    const response = await authService.login({
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    });

    if (response?.token) {
      localStorage.setItem('token', response.token);
    }

    setUser(response?.user || response);
    return response?.user || response;
  };

  const setSession = (nextUser, token) => {
    if (token) {
      localStorage.setItem('token', token);
    }

    setUser(nextUser);
    return nextUser;
  };

  const register = async (data) => {
    const response = await authService.register(data);

    if (response?.token) {
      localStorage.setItem('token', response.token);
    }

    setUser(response?.user || response);
    return response?.user || response;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setSession, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
