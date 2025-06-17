import React, { useState, useEffect } from 'react';
// ✅ CORRECCIÓN: Se agrega `useLocation` para leer el estado de la navegación.
import { useNavigate, useLocation } from 'react-router-dom';
// La ruta de importación `../../services/api` es correcta desde esta ubicación.
import { activateClient, deactivateClient } from '../../services/api';
import './AccountsSection.css';

function AccountsSection({ initialAccounts, onUpdate }) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const navigate = useNavigate();

    // ✅ INICIO: Lógica para manejar el mensaje de éxito
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.message);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                // Limpia el estado para que el mensaje no reaparezca al refrescar
                window.history.replaceState({}, document.title);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    // ✅ FIN: Lógica para manejar el mensaje de éxito

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
        } catch (err) {
            console.error(`Error al cambiar el estado: ${err.message}`);
            alert(`Error al cambiar el estado: ${err.message}`);
        }
    };

    return (
        <div className="accounts-section">
            <div className="section-header">
                <h2>Cuentas</h2>
                <button className="btn-new" onClick={() => navigate('/register-client')}>Nueva Cuenta</button>
            </div>

            {/* ✅ CORRECCIÓN: Se añade el contenedor del mensaje de éxito */}
            {successMessage && (
                <div className="success-alert">
                    {successMessage}
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
                {accounts && accounts.map(acc => (
                    <tr key={acc.id}>
                        <td>{acc.name}</td>
                        <td>{acc.email}</td>
                        <td>{acc.telefono ?? ''}</td>
                        <td>{acc.plan}</td>
                        <td>
                            <span className={`status-badge status-${acc.estado.toLowerCase()}`}>
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
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default AccountsSection;