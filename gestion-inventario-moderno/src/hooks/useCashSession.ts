// src/hooks/useCashSession.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    getActiveCashSession,
    openCashSession,
    closeCashSession,
} from '@/services/api';

export interface CashSession {
    id: string;
    initialBalance: number;
    openedAt: string;
    finalBalance?: number;
    closedAt?: string;
    difference?: number;
}

type ModalMode = 'open' | 'close';

export function useCashSession() {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [session, setSession] = useState<CashSession | null>(null);
    const [isModalOpen, setModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<ModalMode>('open');

    const isCashier =
        user?.roles.includes('ROLE_CAJERO') ||
        user?.roles.includes('ROLE_MULTIFUNCION');

    const checkSession = useCallback(async () => {
        if (!isCashier || !clientId) return;
        try {
            const response = await getActiveCashSession(clientId);
            if (response.status === 200 && response.data) {
                setSession(response.data as CashSession);
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                // No hay sesión activa
                setSession(null);
                setModalMode('open');
                setModalOpen(true);
            } else {
                console.error('Error checking cash session:', err);
            }
        }
    }, [isCashier, clientId]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const handleOpenSession = async (initialAmount: number) => {
        if (!clientId) return;
        try {
            const response = await openCashSession(clientId, initialAmount);
            setSession(response.data as CashSession);
            setModalOpen(false);
        } catch (err) {
            console.error('Error opening session:', err);
            alert('No se pudo abrir la caja.');
        }
    };

    const handleCloseSession = async (countedAmount: number) => {
        if (!clientId) return;
        try {
            const response = await closeCashSession(clientId, countedAmount);
            const closed: CashSession = response.data;
            const diff = closed.difference ?? 0;
            alert(`Caja cerrada. Diferencia: $${diff.toFixed(2)}`);
            setSession(null);
            setModalOpen(false);
        } catch (err) {
            console.error('Error closing session:', err);
            alert('No se pudo cerrar la caja.');
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
    } as const;
}
