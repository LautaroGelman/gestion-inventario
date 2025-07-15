// src/components/client/ReportsSection.tsx
'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { format, subMonths } from 'date-fns';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getCategories, getFinanceMovements } from '@/services/api';

interface Category {
    id: string;
    name: string;
}

interface Movement {
    id: string;
    date: string;      // ISO date string
    amount: number;
    category: string;
}

interface ChartRecord {
    date: string;
    income: number;
    expense: number;
    net: number;
}

export default function ReportsSection({ clientId }: { clientId?: string }) {
    const { user } = useAuth();
    const id = clientId ?? user?.clientId;

    const [from, setFrom] = useState<Date>(subMonths(new Date(), 1));
    const [to, setTo] = useState<Date>(new Date());
    const [categories, setCategories] = useState<Category[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const [catRes, movRes] = await Promise.all([
                    getCategories(id),
                    getFinanceMovements(id, format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')),
                ]);
                setCategories(catRes.data as Category[]);
                setMovements(movRes.data as Movement[]);
                setError('');
            } catch (err: any) {
                console.error('Error fetching report data:', err);
                setError(err.response?.data?.message ||
                    'No se pudo cargar la información de reportes.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, from, to]);

    const fetchMovements = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await getFinanceMovements(id, format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd'));
            setMovements(res.data as Movement[]);
            setError('');
        } catch (err: any) {
            console.error('Error fetching movements:', err);
            setError(err.response?.data?.message ||
                'No se pudo cargar la información de movimientos.');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        if (selected.length === 0) return movements;
        return movements.filter(m => selected.includes(m.category));
    }, [movements, selected]);

    const chartData: ChartRecord[] = useMemo(() => {
        const map = new Map<string, ChartRecord>();
        filtered.forEach(m => {
            const key = format(new Date(m.date), 'yyyy-MM-dd');
            const rec = map.get(key) || { date: key, income: 0, expense: 0, net: 0 };
            if (m.amount >= 0) rec.income += m.amount;
            else rec.expense += Math.abs(m.amount);
            rec.net = rec.income - rec.expense;
            map.set(key, rec);
        });
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [filtered]);

    if (!id) return <div>Esperando ID de cliente…</div>;
    if (loading) return <div>Cargando reportes…</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <section className="report-section">
            <div className="filters">
                <div className="filter-group">
                    <label>
                        Desde{' '}
                        <input
                            type="date"
                            value={format(from, 'yyyy-MM-dd')}
                            onChange={e => setFrom(new Date(e.target.value))}
                        />
                    </label>
                    <label>
                        Hasta{' '}
                        <input
                            type="date"
                            value={format(to, 'yyyy-MM-dd')}
                            onChange={e => setTo(new Date(e.target.value))}
                        />
                    </label>
                </div>
                <div className="filter-group">
                    <label>
                        Categorías{' '}
                        <select
                            multiple
                            value={selected}
                            onChange={e => setSelected(
                                Array.from(e.target.selectedOptions, o => o.value)
                            )}
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="filter-group">
                    <button onClick={fetchMovements}>Aplicar</button>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-wrapper">
                    <h3>Ingresos vs Egresos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="income" name="Ingresos" fill="#10b981" />
                            <Bar dataKey="expense" name="Egresos" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-wrapper">
                    <h3>Flujo neto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="net" name="Flujo neto" stroke="#6366f1" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}
