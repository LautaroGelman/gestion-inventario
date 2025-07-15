// src/components/client/SalesSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSales } from '@/services/api';

interface SaleRecord {
    id: number;
    cliente: string;
    quantity: number;
    totalAmount?: number;
    paymentMethod: string;
    fecha: string; // ISO date string
}

export default function SalesSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!clientId) return;
        (async () => {
            try {
                setLoading(true);
                const response = await getSales(clientId);
                setSales(response.data as SaleRecord[]);
            } catch (err: any) {
                console.error('Error fetching sales:', err);
                setError(err.response?.data?.message || 'No se pudo cargar el historial de ventas.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const handleNewSale = () => {
        router.push('/sale-form');
    };

    const handleReturn = (id: number) => {
        router.push(`/return-sale/${id}`);
    };

    if (loading) return <div>Cargando ventas…</div>;
    if (error)   return <div className="error-message">Error: {error}</div>;

    return (
        <div className="sales-section">
            <div className="section-header">
                <h2>Ventas</h2>
                <button type="button" className="btn-new" onClick={handleNewSale}>
                    Registrar nueva venta
                </button>
            </div>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Método</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {sales.map(sale => (
                    <tr key={sale.id}>
                        <td>{sale.id}</td>
                        <td>{sale.cliente}</td>
                        <td>{sale.quantity}</td>
                        <td>${(sale.totalAmount ?? 0).toFixed(2)}</td>
                        <td>{sale.paymentMethod}</td>
                        <td>{new Date(sale.fecha).toLocaleString()}</td>
                        <td>
                            <button
                                type="button"
                                className="btn-action"
                                onClick={() => handleReturn(sale.id)}
                            >
                                Devolver
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
