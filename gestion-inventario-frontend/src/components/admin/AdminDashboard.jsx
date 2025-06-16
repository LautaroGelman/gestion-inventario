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
                    <h3>Cuentas de Clientes Activas</h3>
                    {/* ✅ Se añade "|| 0" para que muestre 0 si el valor no existe */}
                    <p>{metrics.activeCustomerAccounts || 0}</p>
                </div>
                <div className="card">
                    <h3>Planes de Pago Más Populares</h3>
                    <ul>
                        {/* Tu código aquí ya era seguro, ¡bien hecho! */}
                        {metrics.mostPopularPaymentPlans && metrics.mostPopularPaymentPlans.length > 0 ? (
                            metrics.mostPopularPaymentPlans.map((plan, index) => (
                                <li key={index}>{plan}</li>
                            ))
                        ) : (
                            <li>No hay datos</li>
                        )}
                    </ul>
                </div>
                <div className="card">
                    <h3>Ingresos Totales</h3>
                    {/* ✅ Se protege la llamada a toFixed(2) */}
                    <p>${(metrics.totalRevenue || 0).toFixed(2)}</p>
                </div>
                <div className="card">
                    <h3>Usuarios Registrados</h3>
                    {/* ✅ Se añade "|| 0" para que muestre 0 si el valor no existe */}
                    <p>{metrics.totalUsers || 0}</p>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;