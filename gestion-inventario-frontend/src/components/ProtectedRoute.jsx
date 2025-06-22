import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de que jwt-decode esté instalado

/**
 * Componente de protección de rutas final y robusto.
 * Decodifica el token en el momento para evitar "race conditions" con el estado del contexto.
 */
function ProtectedRoute({ children, allowedRoles }) {
    const location = useLocation();
    const token = localStorage.getItem('token'); // Leemos el token directamente

    // 1. Si no hay token, el usuario no ha iniciado sesión.
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    try {
        // 2. Decodificamos el token para obtener los datos más actuales.
        const decodedUser = jwtDecode(token);

        // 3. Si la ruta requiere roles, los verificamos.
        if (allowedRoles && allowedRoles.length > 0) {
            const userRoles = decodedUser?.roles || [];
            const isAuthorized = userRoles.some(role => allowedRoles.includes(role));

            if (!isAuthorized) {
                // Si el usuario no tiene los roles, lo enviamos a una página de "no autorizado".
                // Como aún no la hemos creado, lo redirigimos a la raíz,
                // donde HomeRedirector lo enviará a su panel por defecto (si lo tiene) o al login.
                return <Navigate to="/" replace />;
            }
        }

        // 4. Si todo está en orden, renderiza el componente protegido.
        return children;

    } catch (error) {
        // Si el token es inválido o corrupto, lo limpiamos y redirigimos al login.
        console.error("Token inválido:", error);
        // Limpiamos token de localStorage y cookie
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
}

export default ProtectedRoute;