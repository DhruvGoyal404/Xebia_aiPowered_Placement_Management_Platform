import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { fileToBase64 } from '../utils/fileToBase64';

const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

const userFromToken = (token) => {
  const p = decodeToken(token);
  if (!p) return null;
  return { id: p.id, username: p.username, email: p.email, role: p.role };
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    if (!t) return null;
    const u = userFromToken(t);
    if (!u) localStorage.removeItem('token');
    return u;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      const u = userFromToken(token);
      if (u) setUser(u);
      else {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  }, [token, user]);

  const register = async (form) => {
    setLoading(true);
    try {
      const { profilePicFile, ...rest } = form;
      const payload = { ...rest, confirmPassword: form.password };
      if (profilePicFile) {
        payload.profilePic = await fileToBase64(profilePicFile);
      }
      const res = await axiosInstance.post('/api/auth/register', payload);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
