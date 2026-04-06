import { createContext, useContext, useState, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);
const normalizeRole = (role) => String(role || 'USER').replace(/^ROLE_/, '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    const id =
      parsed.id != null
        ? Number(parsed.id)
        : parsed.userId != null
          ? Number(parsed.userId)
          : undefined;
    return {
      ...parsed,
      ...(Number.isFinite(id) ? { id } : {}),
      role: normalizeRole(parsed.role),
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const saveSession = useCallback((data) => {
    const normalizedRole = normalizeRole(data.role);
    const rawId = data.userId ?? data.id;
    const id = rawId != null ? Number(rawId) : undefined;
    const userPayload = {
      name: data.name,
      email: data.email,
      role: normalizedRole,
      ...(Number.isFinite(id) ? { id } : {}),
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userPayload));
    setToken(data.token);
    setUser(userPayload);
  }, []);

  const syncSessionUser = useCallback((data) => {
    const normalizedRole = normalizeRole(data.role);
    localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, role: normalizedRole }));
    setUser({ name: data.name, email: data.email, role: normalizedRole });
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    saveSession(res.data);
    return res.data;
  }, [saveSession]);

  const registerWithInvite = useCallback(async (token, name, email, password) => {
    const res = await api.post('/api/auth/register-invite', { token, name, email, password });
    saveSession(res.data);
    return res.data;
  }, [saveSession]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    saveSession(res.data);
    return res.data;
  }, [saveSession]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const res = await api.post('/api/auth/google', { idToken });
    saveSession(res.data);
    return res.data;
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, register, registerWithInvite, login, loginWithGoogle, logout, syncSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
