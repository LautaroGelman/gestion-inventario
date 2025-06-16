import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// La ruta de importación `../../services/api` es correcta desde esta ubicación.
import { activateClient, deactivateClient } from '../../services/api';
import './AccountsSection.css';

function AccountsSection({ initialAccounts, onUpdate }) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const navigate = useNavigate();

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
                {/* ✅ CORRECCIÓN: Se actualiza la ruta para que coincida con App.jsx */}
                <button className="btn-new" onClick={() => navigate('/register-client')}>Nueva Cuenta</button>
            </div>
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