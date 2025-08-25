// src/context/AuthContext.tsx
'use client';

import React, {
  createContext, useState, useContext, useEffect, ReactNode, useMemo,
} from 'react';
import apiClient, { logout as apiLogout } from '@/services/api';

interface DecodedToken {
  clientId?: string | number;
  employeeId?: string | number;
  roles?: string | string[];
  sucursalId?: string | number | null;
  sub?: string;
  clientName?: string;
  employeeName?: string;
  [key: string]: any;
}

export interface User {
  clientId?: string | number;
  employeeId?: string | number;
  sucursalId?: string | number | null;
  roles: string[];
  role: string | null;
  sub?: string;
  clientName?: string;
  employeeName?: string;
}

type AuthResponseLike = {
  token: string | null;
  clientId: number | string | null;
  employeeId: number | string | null;
  sucursalId: number | string | null;
  roles: string[] | string;
  clientName?: string | null;
  employeeName?: string | null;
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: string | AuthResponseLike) => void;
  logout: () => void;
  setSucursalId: (id: number | string | null) => void;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const BRANCH_KEY = (clientId: string | number) => `sucursal:${clientId}`;

/* Helpers */
function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    console.error('Error decoding token', e);
    return null;
  }
}

function normalizeRoles(r: string | string[] | undefined): string[] {
  if (!r) return [];
  const arr = Array.isArray(r) ? r : [r];
  return arr.map(x => (x?.startsWith('ROLE_') ? x : `ROLE_${x}`));
}

function toUser(decoded: DecodedToken | null): User | null {
  if (!decoded) return null;
  const rolesArr = normalizeRoles(decoded.roles as any);
  return {
    clientId: decoded.clientId ?? undefined,
    employeeId: decoded.employeeId ?? undefined,
    sucursalId: decoded.sucursalId ?? null,
    roles: rolesArr,
    role: rolesArr[0] || null,
    sub: decoded.sub,
    clientName: decoded.clientName,
    employeeName: decoded.employeeName,
  };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token');
}

function isOwnerLike(u: User | null): boolean {
  return !!u?.roles?.some(r => r === 'ROLE_PROPIETARIO' || r === 'PROPIETARIO');
}

/* Provider */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwner = useMemo(() => isOwnerLike(user), [user]);

  useEffect(() => {
    try {
      localStorage.removeItem('token');
      document.cookie = 'token=; Max-Age=0; path=/';
    } catch {}

    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      const u = toUser(decoded);
      if (u) {
        if (isOwnerLike(u) && u.sucursalId == null && u.clientId !== undefined) {
          const saved = localStorage.getItem(BRANCH_KEY(u.clientId));
          if (saved !== null) u.sucursalId = saved || null;
        }
        setUser(u);
      }
      (async () => {
        try {
          const me = await apiClient.get('/auth/me');
          const data = me.data as Partial<AuthResponseLike>;
          setUser(prev => {
            const roles = normalizeRoles(data.roles as any) || prev?.roles || [];
            const merged: User = {
              clientId: (data.clientId ?? prev?.clientId) ?? undefined,
              employeeId: (data.employeeId ?? prev?.employeeId) ?? undefined,
              sucursalId: data.sucursalId ?? prev?.sucursalId ?? null,
              roles,
              role: roles[0] ?? null,
              sub: prev?.sub,
              clientName: (data.clientName as any) ?? prev?.clientName,
              employeeName: (data.employeeName as any) ?? prev?.employeeName,
            };
            if (isOwnerLike(merged) && merged.clientId !== undefined) {
              const saved = localStorage.getItem(BRANCH_KEY(merged.clientId));
              if (saved !== null && merged.sucursalId == null) {
                merged.sucursalId = saved || null;
              }
            }
            return merged;
          });
        } catch {
          /* noop */
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const login: AuthContextValue['login'] = (payload) => {
    let token: string | null = null;
    let nextUser: User | null = null;

    if (typeof payload === 'string') {
      token = payload;
      nextUser = toUser(decodeToken(payload));
    } else {
      token = payload.token ?? null;
      const rolesArr = normalizeRoles(payload.roles as any);
      nextUser = {
        clientId: (payload.clientId ?? undefined) as string | number | undefined,
        employeeId: (payload.employeeId ?? undefined) as string | number | undefined,
        sucursalId: payload.sucursalId ?? null,
        roles: rolesArr,
        role: rolesArr[0] ?? null,
        clientName: (payload.clientName ?? undefined) as string | undefined,
        employeeName: (payload.employeeName ?? undefined) as string | undefined,
      };
      if (nextUser && isOwnerLike(nextUser) && nextUser.clientId !== undefined && nextUser.sucursalId == null) {
        const saved = localStorage.getItem(BRANCH_KEY(nextUser.clientId));
        if (saved !== null) nextUser.sucursalId = saved || null;
      }
    }

    if (!token || !nextUser) {
      console.error('Login inválido: falta token o usuario');
      return;
    }

    try {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
      document.cookie = 'token=; Max-Age=0; path=/';
    } catch {}

    setUser(nextUser);
    setLoading(false);
  };

  const logout = () => {
    try { void apiLogout(); } catch {}
    try {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      document.cookie = 'token=; Max-Age=0; path=/';
    } catch {}
    setUser(null);
    setLoading(false);
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  const setSucursalId: AuthContextValue['setSucursalId'] = (id) => {
    // ⬅️ Normalizamos a string o null (evita des-sincronizaciones con <Select>)
    const idStr: string | null = id == null || id === '' ? null : String(id);
    setUser(prev => {
      if (!prev) return prev;
      if (prev.clientId !== undefined) {
        localStorage.setItem(BRANCH_KEY(prev.clientId), String(idStr ?? ''));
      }
      return { ...prev, sucursalId: idStr };
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSucursalId, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
};

/* Hook */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
