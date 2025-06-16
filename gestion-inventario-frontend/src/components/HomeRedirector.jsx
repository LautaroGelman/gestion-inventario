// En gestion-inventario-frontend/src/components/HomeRedirector.jsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomeRedirector() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
        console.log('%cPASO 3: HomeRedirector se ejecuta con este usuario:', 'color: orange; font-size: 14px;', user);
        // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----

        if (!user) {
            return;
        }

        const hasValidRoles = user.roles && Array.isArray(user.roles) && user.roles.length > 0;

        if (hasValidRoles) {
            if (user.roles.includes('ROLE_ADMIN')) {
                // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
                console.log('%cDECISIÓN: El usuario tiene ROLE_ADMIN. Redirigiendo a /admin.', 'color: yellow; font-size: 14px;');
                // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----
                navigate('/admin', { replace: true });
            } else if (user.roles.some(role => ['ROLE_CLIENT', 'ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_MULTIFUNCION'].includes(role))) {
                // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
                console.log('%cDECISIÓN: El usuario tiene un rol de panel. Redirigiendo a /panel.', 'color: yellow; font-size: 14px;');
                // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----
                navigate('/panel', { replace: true });
            } else {
                console.error("Usuario con roles desconocidos, cerrando sesión:", user.roles);
                logout();
            }
        } else {
            console.error("Usuario sin roles válidos, cerrando sesión.");
            logout();
        }
    }, [user, navigate, logout]);

    return null;
}

export default HomeRedirector;