// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Al acceder a '/', redirige según rol:
 * - Sin usuario: '/login'
 * - ROLE_ADMIN:    '/admin'
 * - ROLE_CLIENT o cualquier empleado: '/panel'
 * - Sino: logout
 */
export default function HomeRedirector() {
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.replace('/login');
            return;
        }
        if (user.roles.includes('ROLE_ADMIN')) {
            router.replace('/admin');
            return;
        }
        if (
            user.employeeId ||
            user.roles.includes('ROLE_CLIENT') ||
            user.roles.includes('ROLE_ADMINISTRADOR')
        ) {
            router.replace('/panel');
            return;
        }
        // Si no cumple ninguno, cierra sesión
        logout();
    }, [user, router, logout]);

    return null;
}
