import React, { useState, useEffect } from 'react';
// Asegúrate de que esta ruta sea correcta para tu proyecto
import { getGlobalMetrics } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await getGlobalMetrics();
                setMetrics(response.data);
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || 'Error al obtener las métricas globales';
                if (err.response?.data?.details) {
                    setError(`${errorMessage}: ${err.response.data.details}`);
                } else {
                    setError(errorMessage);
                }
                console.error("Error al obtener las métricas globales:", err);
            }
        };

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
                    <p>{metrics.totalAccounts || 0}</p>
                </div>
                <div className="card">
                    <h3>Planes de Clientes</h3>
                    <ul>
                        <li>Prueba Gratis: {metrics.freeTrialAccounts || 0}</li>
                        <li>Estándar: {metrics.standardAccounts || 0}</li>
                        <li>Premium: {metrics.premiumAccounts || 0}</li>
                    </ul>
                </div>
                <div className="card">
                    <h3>Ingresos (últimos 30 días)</h3>
                    <p>${metrics.totalRevenueLast30d?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="card">
                    <h3>Total de Productos</h3>
                    <p>{metrics.totalProducts || 0}</p>
                </div>
                <div className="card">
                    <h3>Alertas por Bajo Stock</h3>
                    <p>{metrics.lowStockAlerts || 0}</p>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;