import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomeRedirector() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.roles) {
            // Si es SUPER_ADMIN, va al panel de administración.
            if (user.roles.includes('ROLE_SUPER_ADMIN')) {
                navigate('/admin', { replace: true });
            }
            // Si es Cliente o cualquier tipo de Empleado, va al panel de negocio.
            else if (user.roles.some(role => ['ROLE_CLIENT', 'ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_MULTIFUNCION'].includes(role))) {
                navigate('/panel', { replace: true });
            }
            // Como fallback, si no tiene un rol conocido, vuelve al login.
            else {
                navigate('/login', { replace: true });
            }
        }
    }, [user, navigate]);

    // No renderiza nada, solo redirige.
    return null;
}

export default HomeRedirector;