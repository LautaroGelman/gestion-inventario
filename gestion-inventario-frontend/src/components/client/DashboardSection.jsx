import React, { useEffect, useState } from 'react';
// 1. RUTA DE IMPORTACIÓN CORREGIDA:
//    Cambiamos '../' por '../../' para subir dos niveles y llegar a la carpeta 'src'.
import { getClientDashboard, getDailySalesSummary, getProfitabilitySummary } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SalesChart from './SalesChart';
import ProfitabilityChart from './ProfitabilityChart';
import './DashboardSection.css';

function DashboardSection() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [salesChartData, setSalesChartData] = useState(null);
    const [profitabilityData, setProfitabilityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.clientId) {
            return;
        }

        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [dashResponse, salesResponse, profitResponse] = await Promise.all([
                    getClientDashboard(user.clientId),
                    getDailySalesSummary(user.clientId),
                    getProfitabilitySummary(user.clientId)
                ]);

                setDashboardData(dashResponse.data);
                setSalesChartData(salesResponse.data);
                setProfitabilityData(profitResponse.data);

            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo cargar la información del dashboard.');
                console.error("Error fetching dashboard data:", err);

            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [user]);

    if (loading) {
        return <div>Cargando dashboard...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="dashboard-section">
            <h2>Dashboard Cliente</h2>
            <p>Indicadores como stock bajo, últimas ventas y movimientos recientes.</p>

            <div className="dash-cards-container">
                {dashboardData && (
                    <>
                        <div className="dash-card">
                            <h3>Artículos con stock bajo</h3>
                            <p>{dashboardData.lowStockItems}</p>
                        </div>
                        <div className="dash-card">
                            <h3>Ventas del día</h3>
                            <p>{dashboardData.todaySalesCount}</p>
                        </div>
                    </>
                )}
            </div>

            <div className="charts-container">
                <div className="chart-wrapper">
                    {salesChartData ? <SalesChart apiData={salesChartData} /> : <p>Cargando gráfico de ventas...</p>}
                </div>
                <div className="chart-wrapper">
                    {profitabilityData ? <ProfitabilityChart apiData={profitabilityData} /> : <p>Cargando gráfico de rentabilidad...</p>}
                </div>
            </div>
        </div>
    );
}

export default DashboardSection;