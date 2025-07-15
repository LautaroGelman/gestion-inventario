'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { activateClient, deactivateClient } from '@/services/api';

// Define la forma de una cuenta
export interface Account {
    id: number;
    name: string;
    email: string;
    telefono?: string | null;
    plan: 'BASICO' | 'INTERMEDIO' | 'PREMIUM' | string;
    estado: 'ACTIVO' | 'INACTIVO' | string;
}

// Props que recibe el componente
interface AccountsSectionProps {
    initialAccounts: Account[];
    onUpdate: () => Promise<void>;
}

export default function AccountsSection({ initialAccounts, onUpdate }: AccountsSectionProps) {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Lee mensaje y tipo desde query params
    const messageParam = searchParams.get('message');
    const typeParam = searchParams.get('type');

    const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

    // Muestra notificación si hay mensaje en la URL y la limpia
    useEffect(() => {
        if (messageParam) {
            setNotification({ message: messageParam, type: typeParam || 'info' });

            // Reconstruye URL sin parámetros de mensaje
            const section = searchParams.get('section');
            const base = section ? `/admin?section=${section}` : '/admin';
            router.replace(base);

            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [messageParam, typeParam, router, searchParams]);

    // Sincroniza el estado interno con las props
    useEffect(() => {
        setAccounts(initialAccounts);
    }, [initialAccounts]);

    const handleToggleStatus = async (accountId: number, currentStatus: string) => {
        try {
            if (currentStatus === 'ACTIVO') {
                await deactivateClient(accountId.toString());
            } else {
                await activateClient(accountId.toString());
            }
            await onUpdate();
            setNotification({ message: 'Estado del cliente actualizado.', type: 'success' });
            setTimeout(() => setNotification(null), 5000);
        } catch (err: any) {
            console.error(`Error al cambiar el estado: ${err.message}`);
            setNotification({
                message: `Error al cambiar el estado: ${err.response?.data?.message || err.message}`,
                type: 'error'
            });
        }
    };

    return (
        <div id="cuentas" className="p-6 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Cuentas</h2>
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded"
                    onClick={() => router.push('/register-client')}
                >
                    + Nueva Cuenta
                </button>
            </div>

            {notification && (
                <div className={`mb-4 p-2 border-l-4 ${
                    notification.type === 'success'
                        ? 'border-green-600'
                        : notification.type === 'error'
                            ? 'border-red-600'
                            : 'border-blue-600'
                } bg-gray-100`}>
                    {notification.message}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left">Nombre</th>
                        <th className="px-4 py-2 text-left">Correo</th>
                        <th className="px-4 py-2 text-left">Teléfono</th>
                        <th className="px-4 py-2 text-left">Plan</th>
                        <th className="px-4 py-2 text-left">Estado</th>
                        <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {accounts && accounts.length > 0 ? (
                        accounts.map(acc => (
                            <tr key={acc.id} className="border-b">
                                <td className="px-4 py-2">{acc.name}</td>
                                <td className="px-4 py-2">{acc.email}</td>
                                <td className="px-4 py-2">{acc.telefono ?? 'N/A'}</td>
                                <td className="px-4 py-2">{acc.plan}</td>
                                <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                        acc.estado === 'ACTIVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                      {acc.estado}
                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                        className="px-3 py-1 bg-blue-600 text-white rounded"
                                        onClick={() => handleToggleStatus(acc.id, acc.estado)}
                                    >
                                        {acc.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="px-4 py-2 text-center" colSpan={6}>
                                No hay clientes para mostrar.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
