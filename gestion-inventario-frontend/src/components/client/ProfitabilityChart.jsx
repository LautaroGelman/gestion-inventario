// src/components/dashboard/ProfitabilityChart.jsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Colors,
} from 'chart.js';
import { getProfitabilitySummary } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Colors
);

export default function ProfitabilityChart() {
    const { user } = useAuth();
    const [rows,    setRows]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    /* ------------------------- cargar datos -------------------------- */
    useEffect(() => {
        if (!user?.clientId) return;

        (async () => {
            try {
                setLoading(true);
                const { data } = await getProfitabilitySummary(user.clientId);
                console.log('⚡ profitability data:', data);
                setRows(data);
            } catch (err) {
                console.error('Error fetching profitability:', err);
                setError(err.response?.data?.message || 'No se pudo cargar la rentabilidad.');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    /* ----------------------------- UI -------------------------------- */
    if (loading) return <div>Cargando rentabilidad…</div>;
    if (error)   return <div className="error-message">Error: {error}</div>;
    if (!rows.length) return <div>No hay datos de rentabilidad para mostrar.</div>;

    /* ----------------------- preparar gráfico ------------------------ */
    const labels       = rows.map(r => r.date);
    const revenueData  = rows.map(r => r.revenue      ?? 0);
    const costData     = rows.map(r => r.costOfGoods  ?? 0);
    const profitData   = rows.map(r => r.profit       ?? 0);

    const chartData = {
        labels,
        datasets: [
            { label: 'Ingresos',        data: revenueData },
            { label: 'Costo de ventas', data: costData    },
            { label: 'Ganancia',        data: profitData  },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title:  { display: true, text: 'Rentabilidad diaria (últimos 30 días)' },
            tooltip: {
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: $${Number(ctx.parsed.y).toFixed(2)}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { callback: v => `$${Number(v).toFixed(2)}` },
            },
        },
    };

    return (
        <div className="profitability-chart">
            <Line data={chartData} options={options} />
        </div>
    );
}
