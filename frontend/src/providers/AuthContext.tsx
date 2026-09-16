import { createContext, useContext, useState, type ReactNode } from 'react';
import { getToken, setToken, getStoredUser, setStoredUser } from '@/api/client';
import type { AuthUser } from '@/types/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (token: string, user?: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser() as AuthUser | null);

  const login = (newToken: string, newUser?: AuthUser | null) => {
    setToken(newToken);
    setStoredUser(newUser ?? null);
    setTokenState(newToken);
    setUser(newUser ?? null);
  };

  const logout = () => {
    setToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
