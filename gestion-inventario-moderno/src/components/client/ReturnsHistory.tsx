// src/components/client/ReturnsHistory.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/services/api';

interface ReturnRecord {
    saleReturnId: string;
    saleId: string;
    returnedAt: string;
    reason: string;
}

export default function ReturnsHistory() {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [saleId, setSaleId] = useState<string>('');
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [list, setList] = useState<ReturnRecord[]>([]);
    const [msg, setMsg] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const fetchReturns = async () => {
        setMsg('');
        setList([]);
        if (!clientId) return;
        const params: Record<string, string> = {};
        if (saleId) params.saleId = saleId;
        if (from)   params.from   = from;
        if (to)     params.to     = to;

        try {
            setLoading(true);
            const response = await apiClient.get<ReturnRecord[]>(
                `/client-panel/${clientId}/returns`,
                { params }
            );
            const data = response.data;
            setList(data);
            if (data.length === 0) setMsg('No se encontraron devoluciones.');
        } catch (err: any) {
            console.error('Error al cargar devoluciones:', err);
            setMsg('Error al cargar devoluciones.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="returns-history">
            <h2>Historial de devoluciones</h2>

            <div className="filters">
                <input
                    type="number"
                    placeholder="ID venta"
                    value={saleId}
                    onChange={e => setSaleId(e.target.value)}
                />
                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                />
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                />
                <button onClick={fetchReturns} disabled={loading}>
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
            </div>

            {msg && <p className="msg">{msg}</p>}

            {list.length > 0 && (
                <table>
                    <thead>
                    <tr>
                        <th>Devolución</th>
                        <th>Venta</th>
                        <th>Fecha</th>
                        <th>Motivo</th>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map(r => (
                        <tr key={r.saleReturnId}>
                            <td>{r.saleReturnId}</td>
                            <td>{r.saleId}</td>
                            <td>{new Date(r.returnedAt).toLocaleString()}</td>
                            <td>{r.reason}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
