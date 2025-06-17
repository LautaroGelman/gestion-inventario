import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activateClient, deactivateClient } from '../../services/api';
import './AccountsSection.css';

// VOLVEMOS A USAR LOS PROPS: El componente vuelve a recibir los datos de su padre.
function AccountsSection({ initialAccounts, onUpdate }) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const navigate = useNavigate();
    const location = useLocation();

    // LÓGICA DE NOTIFICACIÓN (MANTENIDA): Esto muestra el mensaje de éxito/error.
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        // Si hay un mensaje en el estado de la navegación, lo mostramos.
        if (location.state?.message) {
            setNotification({
                message: location.state.message,
                type: location.state.type || 'info'
            });

            // Limpiamos el estado para que el mensaje no reaparezca.
            navigate(location.pathname, { replace: true, state: {} });

            // La notificación desaparece después de 5 segundos.
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    // LÓGICA ORIGINAL RESTAURADA: Sincroniza el estado con los datos del padre.
    useEffect(() => {
        setAccounts(initialAccounts);
    }, [initialAccounts]);

    const handleToggleStatus = async (accountId, currentStatus) => {
        try {
            if (currentStatus === 'ACTIVO') {
                await deactivateClient(accountId);
            } else {
                await activateClient(accountId);
            }
            // LÓGICA ORIGINAL RESTAURADA: Avisa al padre que actualice los datos.
            onUpdate();
            // Mostramos una notificación local de éxito para esta acción.
            setNotification({ message: 'Estado del cliente actualizado.', type: 'success' });
        } catch (err) {
            console.error(`Error al cambiar el estado: ${err.message}`);
            setNotification({ message: `Error al cambiar el estado: ${err.response?.data?.message || err.message}`, type: 'error' });
        }
    };

    return (
        <div id="cuentas" className="accounts-section admin-section">
            <div className="section-header">
                <h2>Cuentas</h2>
                {/* ACCESO AL FORMULARIO CORREGIDO: Usamos la ruta definida en tu App.jsx */}
                <button className="btn-new" onClick={() => navigate('/register-client')}>
                    + Nueva Cuenta
                </button>
            </div>

            {/* RENDERIZADO DE NOTIFICACIÓN (MANTENIDO) */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <table>
                <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {/* VALIDACIÓN MEJORADA: Comprobamos si hay cuentas antes de mapear */}
                {accounts && accounts.length > 0 ? accounts.map(acc => (
                    <tr key={acc.id}>
                        <td>{acc.name}</td>
                        <td>{acc.email}</td>
                        <td>{acc.telefono ?? 'N/A'}</td>
                        <td>{acc.plan}</td>
                        <td>
                            <span className={`status-badge status-${acc.estado ? acc.estado.toLowerCase() : 'desconocido'}`}>
                                {acc.estado}
                            </span>
                        </td>
                        <td>
                            <button
                                className="btn-toggle-status"
                                onClick={() => handleToggleStatus(acc.id, acc.estado)}
                            >
                                {acc.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                            </button>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="6">No hay clientes para mostrar.</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}

export default AccountsSection;