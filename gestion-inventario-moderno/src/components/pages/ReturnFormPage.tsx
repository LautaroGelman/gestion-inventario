// src/components/ReturnFormPage.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSaleById, createSaleReturn } from '@/services/api';

interface SaleItem {
    saleItemId: number;
    product: { id: number; name: string };
    quantity: number;
}

interface Sale {
    id: number;
    customer: string;
    saleDate: string;
    items: SaleItem[];
}

export default function ReturnFormPage() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();
    const pathname = usePathname();

    // Extraemos saleId del path: /return-sale/[saleId]
    const parts = pathname.split('/');
    const saleIdParam = parts[parts.length - 1];
    const saleId = parseInt(saleIdParam, 10);

    const [sale, setSale] = useState<Sale | null>(null);
    const [returnItems, setReturnItems] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!clientId || isNaN(saleId)) return;
        (async () => {
            try {
                const res = await getSaleById(clientId, saleId.toString());
                setSale(res.data as Sale);
            } catch (err: any) {
                console.error('Error fetching sale details:', err);
                setError(
                    'No se pudieron cargar los detalles de la venta. (El endpoint puede no existir en el backend)'
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, saleId]);

    const handleQuantityChange = (productId: number, qty: number) => {
        if (!sale) return;
        const item = sale.items.find(i => i.product.id === productId);
        if (!item) return;
        const clamped = Math.max(0, Math.min(qty, item.quantity));
        setReturnItems(prev => ({ ...prev, [productId]: clamped }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clientId || isNaN(saleId)) {
            setError('Error de autenticación. No se pudo procesar la devolución.');
            return;
        }
        const itemsToReturn = Object.entries(returnItems)
            .map(([key, val]) => ({ productId: parseInt(key, 10), quantity: val }))
            .filter(item => item.quantity > 0);
        if (itemsToReturn.length === 0) {
            alert('Por favor, selecciona la cantidad de al menos un producto a devolver.');
            return;
        }
        try {
            await createSaleReturn(clientId, { originalSaleId: saleId, items: itemsToReturn });
            alert('Devolución procesada con éxito.');
            router.push('/panel#sales');
        } catch (err: any) {
            console.error('Error creating return:', err);
            setError(err.response?.data?.message || 'Error al procesar la devolución.');
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!sale) return <div>Venta no encontrada.</div>;

    return (
        <div className="return-form-container">
            <h2>Procesar Devolución de Venta #{sale.id}</h2>
            <p><strong>Cliente:</strong> {sale.customer}</p>
            <p><strong>Fecha de Venta:</strong> {new Date(sale.saleDate).toLocaleString()}</p>

            <form onSubmit={handleSubmit}>
                <table className="return-table">
                    <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad Comprada</th>
                        <th>Cantidad a Devolver</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sale.items.map(item => (
                        <tr key={item.product.id}>
                            <td>{item.product.name}</td>
                            <td>{item.quantity}</td>
                            <td>
                                <input
                                    type="number"
                                    min={0}
                                    max={item.quantity}
                                    value={returnItems[item.product.id] || 0}
                                    onChange={e => handleQuantityChange(
                                        item.product.id,
                                        parseInt(e.target.value, 10) || 0
                                    )}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button type="submit" className="submit-button">
                    Confirmar Devolución
                </button>
            </form>
        </div>
    );
}
