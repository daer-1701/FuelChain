'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { API_URL } from '@/lib/api';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isDemo: boolean;
};

type AuthState = {
  user: SessionUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authHeaders: () => HeadersInit;
};

const STORAGE_KEY = 'fc-auth';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          token: string;
          user: SessionUser;
        };
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Login falló');
    }
    const json = (await res.json()) as {
      data: { token: string; user: SessionUser };
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: json.data.token, user: json.data.user }),
    );
    setToken(json.data.token);
    setUser(json.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authHeaders = useCallback((): HeadersInit => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, ready, login, logout, authHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
