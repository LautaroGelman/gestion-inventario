// src/components/ProtectedRoute.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles = [], children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (allowedRoles.length > 0) {
            const isAuthorized = user.roles.some(r => allowedRoles.includes(r));
            if (!isAuthorized) {
                router.replace('/');
            }
        }
    }, [user, loading, allowedRoles, router]);

    if (loading) return null;
    return <>{children}</>;
}
