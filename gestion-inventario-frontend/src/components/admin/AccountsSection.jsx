import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIÓN CORREGIDA:
//    Importamos las funciones específicas que necesitamos.
import { activateClient, deactivateClient } from '../../services/api';
import './AccountsSection.css';

// El componente ahora recibe 'initialAccounts' como una prop.
function AccountsSection({ initialAccounts, onUpdate }) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const navigate = useNavigate();

    useEffect(() => {
        setAccounts(initialAccounts);
    }, [initialAccounts]);

    const handleToggleStatus = async (accountId, currentStatus) => {
        try {
            // 2. LLAMADA A LA API CORREGIDA:
            //    Usamos las funciones específicas en lugar de construir la URL.
            if (currentStatus === 'ACTIVO') {
                await deactivateClient(accountId);
            } else {
                await activateClient(accountId);
            }
            // Llamamos a la función onUpdate del padre para refrescar la lista.
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
                <button className="btn-new" onClick={() => navigate('/form-cliente')}>Nueva Cuenta</button>
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
                {/* Nos aseguramos de que 'accounts' no sea nulo antes de mapear */}
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