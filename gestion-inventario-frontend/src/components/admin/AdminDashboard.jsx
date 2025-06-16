import React, { useState, useEffect } from 'react';
import { getGlobalMetrics } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Se llama a la función del servicio que obtiene las métricas.
                const response = await getGlobalMetrics();
                setMetrics(response.data);
            } catch (err) {
                // Manejo de errores mejorado para dar más detalles.
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
    }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente.

    // Mensaje mientras se cargan los datos.
    if (!metrics && !error) {
        return <div>Cargando datos del dashboard...</div>;
    }

    // Mensaje de error si la petición falla.
    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    // Renderizado del panel una vez que los datos están disponibles.
    return (
        <div className="admin-dashboard">
            <header>
                <h1>Bienvenido, Admin</h1>
                <h2>Panel de Super Administrador</h2>
            </header>
            <section className="cards">
                <div className="card">
                    <h3>Cuentas de Clientes Activas</h3>
                    <p>{metrics.activeCustomerAccounts}</p>
                </div>
                <div className="card">
                    <h3>Planes de Pago Más Populares</h3>
                    <ul>
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
                    {/* toFixed(2) para mostrar dos decimales */}
                    <p>${metrics.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="card">
                    <h3>Usuarios Registrados</h3>
                    <p>{metrics.totalUsers}</p>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;