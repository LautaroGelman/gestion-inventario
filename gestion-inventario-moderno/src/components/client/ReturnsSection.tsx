// src/components/client/ReturnsSection.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/services/api';

interface ReturnRecord {
    saleReturnId: string;
    saleId: string;
    returnedAt?: string;
    returnDate?: string;
    reason: string;
}

interface SaleItem {
    saleItemId: number;
    productId: string;
    quantity: number;
}

interface Sale {
    id: number;
    fecha: string;
    items: SaleItem[];
}

export default function ReturnsSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const [mode, setMode] = useState<'list' | 'form'>('list');

    // List state
    const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
    const [filterSaleId, setFilterSaleId] = useState<string>('');
    const [listLoading, setListLoading] = useState<boolean>(false);
    const [listMsg, setListMsg] = useState<string>('');

    // Form state
    const [saleId, setSaleId] = useState<string>('');
    const [sale, setSale] = useState<Sale | null>(null);
    const [returnQty, setReturnQty] = useState<Record<number, number>>({});
    const [reason, setReason] = useState<string>('');
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [formMsg, setFormMsg] = useState<string>('');

    const loadReturns = async () => {
        setListMsg('');
        setListLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filterSaleId) params.saleId = filterSaleId;
            const response = await apiClient.get<ReturnRecord[]>(
                `/client-panel/${clientId}/returns`, { params }
            );
            const data = response.data;
            setReturnsList(data);
            if (data.length === 0) setListMsg('No se encontraron devoluciones.');
        } catch (err: any) {
            console.error(err);
            setListMsg('Error al cargar devoluciones.');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'list') loadReturns();
    }, [mode, clientId]);

    const fetchSale = async () => {
        setFormMsg('');
        setSale(null);
        setReturnQty({});
        if (!saleId) return;
        try {
            setFormLoading(true);
            const response = await apiClient.get<Sale>(
                `/client-panel/${clientId}/sales/${saleId}`
            );
            setSale(response.data);
        } catch (err: any) {
            console.error(err);
            setFormMsg(err.response?.data?.message || 'Venta no encontrada');
        } finally {
            setFormLoading(false);
        }
    };

    const handleQtyChange = (saleItemId: number, max: number, value: string) => {
        const qty = Number(value);
        if (qty < 0 || qty > max) return;
        setReturnQty(prev => ({ ...prev, [saleItemId]: qty }));
    };

    const handleSubmitReturn = async (e: FormEvent) => {
        e.preventDefault();
        const items = Object.entries(returnQty)
            .filter(([, qty]) => qty > 0)
            .map(([saleItemId, quantity]) => (
                { saleItemId: Number(saleItemId), quantity }
            ));
        if (items.length === 0) {
            setFormMsg('Selecciona al menos un artículo con cantidad mayor a 0');
            return;
        }
        if (!reason.trim()) {
            setFormMsg('Indica el motivo de la devolución');
            return;
        }
        try {
            setFormLoading(true);
            await apiClient.post(
                `/client-panel/${clientId}/returns`,
                { saleId: Number(saleId), reason, items }
            );
            setFormMsg('✅ Devolución registrada correctamente');
            setSale(null);
            setSaleId('');
            setReason('');
            setReturnQty({});
        } catch (err: any) {
            console.error(err);
            setFormMsg(err.response?.data?.message || 'Error al registrar la devolución');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="returns-section">
            <div className="top-bar">
                <h2>Devoluciones</h2>
                {mode === 'list' ? (
                    <button className="btn-primary" onClick={() => {
                        setMode('form');
                        setFormMsg('');
                    }}>
                        Nueva devolución
                    </button>
                ) : (
                    <button className="btn-secondary" onClick={() => {
                        setMode('list');
                        setListMsg('');
                    }}>
                        Volver al listado
                    </button>
                )}
            </div>

            {mode === 'list' ? (
                <>
                    <div className="filters">
                        <input
                            type="number"
                            placeholder="Filtrar por ID de venta"
                            value={filterSaleId}
                            onChange={e => setFilterSaleId(e.target.value)}
                        />
                        <button onClick={loadReturns} disabled={listLoading}>
                            {listLoading ? 'Buscando...' : 'Aplicar filtro'}
                        </button>
                    </div>
                    {listMsg && <p className="msg">{listMsg}</p>}
                    {returnsList.length > 0 && (
                        <table>
                            <thead>
                            <tr>
                                <th>ID Devolución</th>
                                <th>ID Venta</th>
                                <th>Fecha</th>
                                <th>Motivo</th>
                            </tr>
                            </thead>
                            <tbody>
                            {returnsList.map(r => (
                                <tr key={r.saleReturnId}>
                                    <td>{r.saleReturnId}</td>
                                    <td>{r.saleId}</td>
                                    <td>{new Date(r.returnDate || r.returnedAt!).toLocaleString()}</td>
                                    <td>{r.reason}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </>
            ) : (
                <>
                    <div className="search-sale">
                        <input
                            type="number"
                            placeholder="ID de venta"
                            value={saleId}
                            onChange={e => setSaleId(e.target.value)}
                        />
                        <button onClick={fetchSale} disabled={formLoading || !saleId}>
                            {formLoading ? 'Buscando...' : 'Buscar venta'}
                        </button>
                    </div>
                    {sale && (
                        <form className="return-form" onSubmit={handleSubmitReturn}>
                            <h3>Venta #{sale.id} – {new Date(sale.fecha).toLocaleDateString()}</h3>
                            <table>
                                <thead>
                                <tr><th>Producto</th><th>Cant. vendida</th><th>Cant. a devolver</th></tr>
                                </thead>
                                <tbody>
                                {sale.items.map(it => (
                                    <tr key={it.saleItemId}>
                                        <td>{it.productId}</td>
                                        <td>{it.quantity}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min={0}
                                                max={it.quantity}
                                                value={returnQty[it.saleItemId] ?? 0}
                                                onChange={e => handleQtyChange(it.saleItemId, it.quantity, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="reason-field">
                                <label>Motivo de devolución:</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    required
                                />
                            </div>
                            {formMsg && <p className="msg">{formMsg}</p>}
                            <button type="submit" className="btn-submit">Registrar devolución</button>
                        </form>
                    )}
                    {!sale && formMsg && <p className="msg">{formMsg}</p>}
                </>
            )}
        </div>
    );
}
