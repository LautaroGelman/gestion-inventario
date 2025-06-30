// src/pages/client/DashboardSection.jsx
import React, { useEffect, useState } from 'react';
import {
    getClientDashboard,
    getDailySalesSummary,
    getProfitabilitySummary,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SalesChart from './SalesChart';
import ProfitabilityChart from './ProfitabilityChart';
import './DashboardSection.css';

export default function DashboardSection() {
    const { user } = useAuth();

    const [dash,   setDash]   = useState(null);
    const [sales,  setSales]  = useState(null);
    const [profit, setProfit] = useState(null);
    const [err,    setErr]    = useState('');
    const [loading, setLoading] = useState(true);

    /* --------------------- cargar datos en paralelo ------------------ */
    useEffect(() => {
        if (!user?.clientId) return;

        (async () => {
            try {
                setLoading(true);
                const [dRes, sRes, pRes] = await Promise.all([
                    getClientDashboard(user.clientId),
                    getDailySalesSummary(user.clientId),
                    getProfitabilitySummary(user.clientId),
                ]);
                setDash(dRes.data);
                setSales(sRes.data);
                setProfit(pRes.data);
            } catch (e) {
                console.error('Error fetching dashboard:', e);
                setErr(e.response?.data?.message || 'No se pudo cargar la información del dashboard.');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    /* ----------------------------- UI -------------------------------- */
    if (loading) return <div>Cargando dashboard…</div>;
    if (err)     return <div className="error-message">Error: {err}</div>;

    return (
        <div className="dashboard-section">
            <h2>Dashboard cliente</h2>
            <p>Resumen de stock bajo y ventas recientes.</p>

            {/* ---- Tarjetas de indicadores ---- */}
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

            {/* ---- Gráficos ---- */}
            <div className="charts-container">
                <div className="chart-wrapper">
                    {sales
                        ? <SalesChart apiData={sales} />
                        : <p>Cargando gráfico de ventas…</p>}
                </div>

                <div className="chart-wrapper">
                    {profit
                        ? <ProfitabilityChart apiData={profit} />
                        : <p>Cargando gráfico de rentabilidad…</p>}
                </div>
            </div>
        </div>
    );
}
