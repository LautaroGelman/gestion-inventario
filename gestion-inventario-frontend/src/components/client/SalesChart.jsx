// src/components/dashboard/SalesChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Colors
} from 'chart.js';

// Registramos los módulos necesarios de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Colors
);

/**
 * Muestra la cantidad de ventas (barras) y el importe total (línea)
 * de los últimos 30 días. Recibe `apiData` con:
 *   [{ date, salesCount, totalAmount }, …]
 */
export default function SalesChart({ apiData }) {
    const chartData = {
        labels: apiData.map(d => d.date),
        datasets: [
            {
                label: 'Cantidad de ventas',
                data:  apiData.map(d => d.salesCount),
                yAxisID: 'yVentas',
                type: 'bar',
            },
            {
                label: 'Importe total ($)',
                data:  apiData.map(d => d.totalAmount),
                yAxisID: 'yImporte',
                type: 'line',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x:      { title: { display: true, text: 'Fecha' } },
            yVentas: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Cantidad' },
            },
            yImporte: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Importe ($)' },
                ticks: { callback: v => `$${v}` },
            },
        },
        plugins: {
            legend: { position: 'top' },
            title:  { display: true, text: 'Ventas e importe por día (últimos 30 días)' },
            tooltip: {
                callbacks: {
                    label: ctx => {
                        const label = ctx.dataset.label || '';
                        const val   = ctx.parsed.y ?? 0;
                        return label.includes('Importe')
                            ? `${label}: $${Number(val).toFixed(2)}`
                            : `${label}: ${val}`;
                    },
                },
            },
        },
    };

    return <Bar data={chartData} options={options} />;
}
