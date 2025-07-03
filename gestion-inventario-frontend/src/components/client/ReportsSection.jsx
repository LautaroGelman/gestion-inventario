// src/components/client/ReportsSection.jsx

import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../services/api";
import { format, subMonths } from "date-fns";
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
} from "recharts";
import "./ReportsSection.css";

export default function ReportsSection({ clientId }) {
    const [from, setFrom] = useState(subMonths(new Date(), 1));
    const [to, setTo] = useState(new Date());
    const [categories, setCategories] = useState([]);
    const [movements, setMovements] = useState([]);
    const [selected, setSelected] = useState([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    // Carga inicial y al cambiar fechas
    useEffect(() => {
        if (!clientId) return;

        (async () => {
            try {
                setLoading(true);
                const [catRes, movRes] = await Promise.all([
                    apiClient.get(`/client-panel/${clientId}/categories`),
                    apiClient.get(`/client-panel/${clientId}/finance/movements`, {
                        params: {
                            from: format(from, "yyyy-MM-dd"),
                            to: format(to, "yyyy-MM-dd"),
                        },
                    }),
                ]);
                setCategories(catRes.data);
                setMovements(movRes.data);
                setErr("");
            } catch (e) {
                console.error("Error fetching report data:", e);
                setErr(
                    e.response?.data?.message ||
                    "No se pudo cargar la información de reportes."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, from, to]);

    // Refrescar movimientos al hacer clic en "Aplicar"
    const fetchMovements = async () => {
        if (!clientId) return;
        try {
            setLoading(true);
            const res = await apiClient.get(
                `/client-panel/${clientId}/finance/movements`,
                {
                    params: {
                        from: format(from, "yyyy-MM-dd"),
                        to: format(to, "yyyy-MM-dd"),
                    },
                }
            );
            setMovements(res.data);
            setErr("");
        } catch (e) {
            console.error("Error fetching movements:", e);
            setErr(
                e.response?.data?.message ||
                "No se pudo cargar la información de movimientos."
            );
        } finally {
            setLoading(false);
        }
    };

    // Filtrado por categorías
    const filtered = useMemo(() => {
        if (selected.length === 0) return movements;
        return movements.filter(m => selected.includes(m.category));
    }, [movements, selected]);

    // Preparar datos para los gráficos
    const chartData = useMemo(() => {
        const map = new Map();
        filtered.forEach(m => {
            const key = format(new Date(m.date), "yyyy-MM-dd");
            const obj = map.get(key) || { date: key, income: 0, expense: 0, net: 0 };
            if (m.amount >= 0) obj.income += m.amount;
            else obj.expense += Math.abs(m.amount);
            obj.net = obj.income - obj.expense;
            map.set(key, obj);
        });
        return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
    }, [filtered]);

    // Render condicional
    if (!clientId) return <div>Esperando ID de cliente…</div>;
    if (loading)   return <div>Cargando reportes…</div>;
    if (err)       return <div className="error-message">Error: {err}</div>;

    return (
        <section className="report-section">
            {/* Filtros */}
            <div className="filters">
                <div className="filter-group">
                    <label>
                        Desde{" "}
                        <input
                            type="date"
                            value={format(from, "yyyy-MM-dd")}
                            onChange={e => setFrom(new Date(e.target.value))}
                        />
                    </label>
                    <label>
                        Hasta{" "}
                        <input
                            type="date"
                            value={format(to, "yyyy-MM-dd")}
                            onChange={e => setTo(new Date(e.target.value))}
                        />
                    </label>
                </div>

                <div className="filter-group">
                    <label>
                        Categorías{" "}
                        <select
                            multiple
                            value={selected}
                            onChange={e =>
                                setSelected(
                                    Array.from(
                                        e.target.selectedOptions,
                                        o => o.value
                                    )
                                )
                            }
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="filter-group">
                    <button onClick={fetchMovements}>Aplicar</button>
                </div>
            </div>

            {/* Gráficos */}
            <div className="charts-container">
                <div className="chart-wrapper">
                    <h3>Ingresos vs Egresos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="income"  name="Ingresos" />
                            <Bar dataKey="expense" name="Egresos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-wrapper">
                    <h3>Flujo neto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="net" name="Flujo neto" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}
