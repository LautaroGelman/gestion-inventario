import { useState, useEffect, useCallback } from 'react';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos las funciones específicas de la API que necesitamos.
import { getActiveCashSession, openCashSession, closeCashSession } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useCashSession() {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('open'); // 'open' or 'close'

    const isCashier = user?.role === 'CAJERO' || user?.role === 'MULTIFUNCION';

    const checkSession = useCallback(async () => {
        // Nos aseguramos de tener el rol y el clientId antes de actuar
        if (!isCashier || !user?.clientId) return;

        try {
            // 2. LLAMADA GET CORREGIDA:
            const response = await getActiveCashSession(user.clientId);
            if (response.status === 200 && response.data) {
                setSession(response.data);
            }
        } catch (error) {
            // Si hay un error (ej. 404 Not Found), asumimos que no hay sesión abierta
            if (error.response && error.response.status === 404) {
                setSession(null);
                setModalMode('open');
                setModalOpen(true); // Forzar apertura de caja si no hay sesión
            } else {
                console.error("Error checking cash session:", error);
            }
        }
    }, [isCashier, user?.clientId]); // Dependemos del clientId del usuario

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const handleOpenSession = async (initialAmount) => {
        if (!user?.clientId) return;
        try {
            // El backend DTO espera 'initialBalance'
            const response = await openCashSession(user.clientId, initialAmount);
            setSession(response.data);
            setModalOpen(false);
        } catch (error) {
            console.error("Error opening session:", error);
            alert("No se pudo abrir la caja.");
        }
    };

    const handleCloseSession = async (countedAmount) => {
        if (!user?.clientId) return;
        try {
            // El backend DTO espera 'finalBalance'
            const response = await closeCashSession(user.clientId, countedAmount);
            const closedSession = response.data;
            alert(`Caja cerrada. Diferencia: $${closedSession.difference.toFixed(2)}`);
            setSession(null);
            setModalOpen(false);
        } catch (error) {
            console.error("Error closing session:", error);
            alert("No se pudo cerrar la caja.");
        }
    };

    const showCloseModal = () => {
        setModalMode('close');
        setModalOpen(true);
    };

    return {
        session,
        isModalOpen,
        modalMode,
        handleOpenSession,
        handleCloseSession,
        showCloseModal,
        setModalOpen,
    };
}