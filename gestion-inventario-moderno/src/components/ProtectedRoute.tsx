// src/components/ProtectedRoute.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles = [], children }: ProtectedRouteProps) {
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('token')
            : null;

        if (!token) {
            router.replace('/login');
            return;
        }

        let decoded: any;
        try {
            decoded = jwtDecode(token);
        } catch (error) {
            console.error('[ProtectedRoute] Token inválido:', error);
            localStorage.removeItem('token');
            logout();
            router.replace('/login');
            return;
        }

        const roles = Array.isArray(decoded.roles)
            ? decoded.roles
            : [decoded.roles].filter(Boolean);

        if (allowedRoles.length > 0) {
            const isAuthorized = roles.some((r: string) => allowedRoles.includes(r));
            if (!isAuthorized) {
                router.replace('/');
            }
        }
    }, [allowedRoles, logout, router, pathname]);

    return <>{children}</>;
}
