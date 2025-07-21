// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomeRedirector() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
            return;
        }
        if (user.roles.includes('ROLE_ADMIN')) {
            router.replace('/admin');
            return;
        }
        if (user.employeeId || user.roles.includes('ROLE_CLIENT')) {
            router.replace('/panel');
            return;
        }
        logout();
    }, [user, loading, router, logout]);

    return null;
}
