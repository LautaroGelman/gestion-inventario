// src/context/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface DecodedToken {
    clientId?: string;
    employeeId?: string;
    roles?: string | string[];
    sub?: string;
    clientName?: string;
    employeeName?: string;
    [key: string]: any;
}

export interface User {
    clientId?: string;
    employeeId?: string;
    roles: string[];
    role: string | null;
    sub?: string;
    clientName?: string;
    employeeName?: string;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): DecodedToken | null {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const json = atob(padded);
        return JSON.parse(json);
    } catch (e) {
        console.error('Error decoding token', e);
        return null;
    }
}

function buildUser(decoded: DecodedToken | null): User | null {
    if (!decoded) return null;
    const rolesArr = Array.isArray(decoded.roles)
        ? decoded.roles
        : decoded.roles
            ? [decoded.roles]
            : [];
    return {
        clientId: decoded.clientId,
        employeeId: decoded.employeeId,
        roles: rolesArr,
        role: rolesArr[0] || null,
        sub: decoded.sub,
        clientName: decoded.clientName,
        employeeName: decoded.employeeName,
    };
}

function getToken(): string | null {
    // 1) localStorage
    if (typeof window !== 'undefined') {
        const ls = localStorage.getItem('token');
        if (ls) return ls;
        // 2) cookie named 'token'
        const m = document.cookie.match(/(^|; )token=([^;]+)/);
        if (m) return decodeURIComponent(m[2]);
    }
    return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        if (token) {
            const decoded = decodeToken(token);
            const u = buildUser(decoded);
            if (u) setUser(u);
            else document.cookie = 'token=; Max-Age=0; path=/';
        }
        setLoading(false);
    }, []);

    const login = (token: string) => {
        // guarda en localStorage y en cookie
        localStorage.setItem('token', token);
        document.cookie = `token=${encodeURIComponent(token)}; path=/;`;
        const decoded = decodeToken(token);
        const u = buildUser(decoded);
        if (u) setUser(u);
        setLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; Max-Age=0; path=/';
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
