// src/components/client/DashboardSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
    getClientDashboard,
    getDailySalesSummary,
    getProfitabilitySummary,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import VentasChart from '@/components/ui/VentasChart';
import RentabilidadChart from '@/components/ui/RentabilidadChart';

interface DashboardData {
    lowStock: number;
    salesToday: number;
}

export default function DashboardSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [dash, setDash]       = useState<DashboardData | null>(null);
    const [sales, setSales]     = useState<any[] | null>(null);
    const [profit, setProfit]   = useState<any[] | null>(null);
    const [err, setErr]         = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!clientId) return;

        (async () => {
            try {
                setLoading(true);
                const [dRes, sRes, pRes] = await Promise.all([
                    getClientDashboard(clientId),
                    getDailySalesSummary(clientId),
                    getProfitabilitySummary(clientId),
                ]);
                setDash(dRes.data as DashboardData);
                setSales(sRes.data as any[]);
                setProfit(pRes.data as any[]);
            } catch (e: any) {
                console.error('Error fetching dashboard:', e);
                setErr(e.response?.data?.message || 'No se pudo cargar la información del dashboard.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    if (loading) return <div>Cargando dashboard…</div>;
    if (err)     return <div className="error-message">Error: {err}</div>;

    return (
        <div className="dashboard-section">
            <h2>Dashboard cliente</h2>
            <p>Resumen de stock bajo y ventas recientes.</p>

            {dash && (
                <div className="dash-cards-container">
                    <div className="dash-card">
                        <h3>Artículos con stock bajo</h3>
                        <p>{dash.lowStock}</p>
                    </div>
                    <div className="dash-card">
                        <h3>Ventas del día</h3>
                        <p>{dash.salesToday}</p>
                    </div>
                </div>
            )}

            <div className="charts-container">
                <div className="chart-wrapper">
                    {sales
                        ? <VentasChart data={sales} />
                        : <p>Cargando gráfico de ventas…</p>}
                </div>

                <div className="chart-wrapper">
                    {profit
                        ? <RentabilidadChart data={profit} />
                        : <p>Cargando gráfico de rentabilidad…</p>}
                </div>
            </div>
        </div>
    );
}
