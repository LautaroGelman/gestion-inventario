import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activateClient, deactivateClient } from '../../services/api';
import './AccountsSection.css';

function AccountsSection({ initialAccounts, onUpdate }) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const navigate = useNavigate();
    const location = useLocation();

    const [notification, setNotification] = useState(null);

    useEffect(() => {
        // ✅ Detecta mensajes en el estado de navegación
        if (location.state?.message) {
            setNotification({
                message: location.state.message,
                type: location.state.type || 'info'
            });

            // ✅ Limpia el estado para evitar mostrar el mensaje de nuevo en recargas
            navigate(location.pathname + location.hash, {
                replace: true,
                state: {}
            });

            // ✅ Oculta la notificación después de 5 segundos
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    // ✅ Sincroniza cuentas con las props que vienen del padre
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
            onUpdate();
            setNotification({ message: 'Estado del cliente actualizado.', type: 'success' });
        } catch (err) {
            console.error(`Error al cambiar el estado: ${err.message}`);
            setNotification({
                message: `Error al cambiar el estado: ${err.response?.data?.message || err.message}`,
                type: 'error'
            });
        }
    };

    return (
        <div id="cuentas" className="accounts-section admin-section">
            <div className="section-header">
                <h2>Cuentas</h2>
                <button className="btn-new" onClick={() => navigate('/register-client')}>
                    + Nueva Cuenta
                </button>
            </div>

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
                {accounts && accounts.length > 0 ? (
                    accounts.map(acc => (
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
                    ))
                ) : (
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
