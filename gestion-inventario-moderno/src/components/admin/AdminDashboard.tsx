// src/components/admin/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { getGlobalMetrics } from '@/services/api';

interface GlobalMetrics {
    totalAccounts: number;
    freeTrialAccounts: number;
    standardAccounts: number;
    premiumAccounts: number;
    totalRevenueLast30d: number;
    totalProducts: number;
    lowStockAlerts: number;
    [key: string]: any;
}

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const response = await getGlobalMetrics();
                setMetrics(response.data as GlobalMetrics);
            } catch (err: any) {
                const baseMsg = err.response?.data?.message || err.message ||
                    'Error al obtener las métricas globales';
                const details = err.response?.data?.details
                    ? `: ${err.response.data.details}`
                    : '';
                setError(`${baseMsg}${details}`);
                console.error('Error al obtener las métricas globales:', err);
            }
        }
        fetchMetrics();
    }, []);

    if (!metrics && !error) {
        return <div>Cargando datos del dashboard...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="admin-dashboard">
            <header>
                <h1>Bienvenido, Admin</h1>
                <h2>Panel de Super Administrador</h2>
            </header>

            <section className="cards">
                <div className="card">
                    <h3>Cuentas Totales</h3>
                    <p>{metrics!.totalAccounts}</p>
                </div>

                <div className="card">
                    <h3>Planes de Clientes</h3>
                    <ul>
                        <li>Prueba Gratis: {metrics!.freeTrialAccounts}</li>
                        <li>Estándar: {metrics!.standardAccounts}</li>
                        <li>Premium: {metrics!.premiumAccounts}</li>
                    </ul>
                </div>

                <div className="card">
                    <h3>Ingresos (últimos 30 días)</h3>
                    <p>${metrics!.totalRevenueLast30d.toFixed(2)}</p>
                </div>

                <div className="card">
                    <h3>Total de Productos</h3>
                    <p>{metrics!.totalProducts}</p>
                </div>

                <div className="card">
                    <h3>Alertas por Bajo Stock</h3>
                    <p>{metrics!.lowStockAlerts}</p>
                </div>
            </section>
        </div>
    );
}
