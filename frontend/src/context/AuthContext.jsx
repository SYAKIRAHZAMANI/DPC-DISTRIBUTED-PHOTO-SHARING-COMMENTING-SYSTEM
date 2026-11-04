import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (getToken()) api('/auth/me').then(d => setUser(d.user)).catch(() => localStorage.removeItem('moments_token')).finally(() => setLoading(false)); else setLoading(false); }, []);
  const login = async (email, password) => { const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('moments_token', d.token); setUser(d.user); };
  const register = async (name, email, password) => { const d = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }); localStorage.setItem('moments_token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('moments_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
