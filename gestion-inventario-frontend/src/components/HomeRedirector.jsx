import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomeRedirector() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('[HomeRedirector] user:', user);

        /* ---- Sin usuario → login ---- */
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        /* ---- Super-admin puro ---- */
        if (user.roles.includes('ROLE_ADMIN')) {
            console.log('[HomeRedirector] → ROLE_ADMIN → /admin');
            navigate('/admin', { replace: true });
            return;
        }

        /* ---- Dueño o empleado (incluye ADMINISTRADOR) ---- */
        if (
            user.employeeId ||                       // cualquier empleado
            user.roles.includes('ROLE_CLIENT') ||    // dueño
            user.roles.includes('ROLE_ADMINISTRADOR')// dueño-administrador
        ) {
            console.log('[HomeRedirector] → /panel');
            navigate('/panel', { replace: true });
            return;
        }

        /* ---- Ningún rol válido → logout ---- */
        console.warn('[HomeRedirector] → sin rol, cerrando sesión');
        logout();
    }, [user, navigate, logout]);

    return null;
}

export default HomeRedirector;
