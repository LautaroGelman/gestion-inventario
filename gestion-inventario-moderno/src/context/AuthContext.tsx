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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const decoded = decodeToken(token);
        const u = buildUser(decoded);
        if (u) {
            setUser(u);
        } else {
            localStorage.removeItem('token');
        }
    }, []);

    const login = (token: string) => {
        console.log('AuthContext received token:', token);
        const decoded = decodeToken(token);
        const u = buildUser(decoded);
        if (!u) {
            console.error('Invalid token');
            return;
        }
        console.log('Token decoded successfully:', u);
        localStorage.setItem('token', token);
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
