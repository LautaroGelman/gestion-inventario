// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';   // Asegúrate de que jwt-decode esté instalado

/**
 * Componente de protección de rutas.
 * Decodifica el JWT “en vivo” para evitar diferencias de estado con el contexto.
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
    const location = useLocation();
    const token = localStorage.getItem('token');      // 1. Token desde storage

    /* ---------- SIN TOKEN → LOGIN ---------- */
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    try {
        /* ---------- DECODE ---------- */
        const decodedUser = jwtDecode(token);
        const userRoles = Array.isArray(decodedUser?.roles)
            ? decodedUser.roles
            : [decodedUser?.roles].filter(Boolean);       // Normaliza a array

        /* DEBUG ↓ (bórralo en prod) */
        console.log('[ProtectedRoute] userRoles:', userRoles);
        console.log('[ProtectedRoute] allowedRoles:', allowedRoles);

        /* ---------- CHECK ROLES ---------- */
        if (allowedRoles.length > 0) {
            const isAuthorized = userRoles.some(r => allowedRoles.includes(r));

            if (!isAuthorized) {
                // No tiene permiso → lo enviamos a raíz
                return <Navigate to="/" replace />;
            }
        }

        /* ---------- OK → RENDER ---------- */
        return children;

    } catch (error) {
        /* ---------- TOKEN CORRUPTO ---------- */
        console.error('[ProtectedRoute] Token inválido:', error);
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
}

export default ProtectedRoute;
