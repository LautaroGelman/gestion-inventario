import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomeRedirector() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            return;
        }

        const hasValidRoles = user.roles && Array.isArray(user.roles) && user.roles.length > 0;

        if (hasValidRoles) {
            if (user.roles.includes('ROLE_ADMIN')) {
                navigate('/admin', { replace: true });
            } else if (user.roles.some(role => ['ROLE_CLIENT', 'ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_MULTIFUNCION'].includes(role))) {
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