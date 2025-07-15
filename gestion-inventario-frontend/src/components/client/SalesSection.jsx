// src/components/SalesSection.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './SalesSection.css';

export default function SalesSection() {
    const { user } = useAuth();
    const [sales,   setSales]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');
    const navigate              = useNavigate();

    /* ------------------------------ fetch ----------------------------- */
    useEffect(() => {
        if (!user?.clientId) return;
        (async () => {
            try {
                setLoading(true);
                const { data } = await getSales(user.clientId);
                console.log('⚡ sales payload:', data);
                setSales(data);
            } catch (e) {
                console.error('Error fetching sales:', e);
                setError(e.response?.data?.message || 'No se pudo cargar el historial de ventas.');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    /* ---------------------------- helpers ----------------------------- */
    const handleNewSale = () => navigate('/sale-form');
    const handleReturn  = id  => navigate(`/return-sale/${id}`);

    /* ------------------------------ UI -------------------------------- */
    if (loading) return <div>Cargando ventas…</div>;
    if (error)   return <div className="error-message">Error: {error}</div>;

    return (
        <div className="sales-section">
            <div className="section-header">
                <h2>Ventas</h2>
                <button type="button" className="btn-new" onClick={handleNewSale}>Registrar nueva venta</button>
            </div>

            <table>
                <thead>
                <tr><th>ID</th><th>Cliente</th><th>Cantidad</th><th>Total</th><th>Método</th><th>Fecha</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                {sales.map(sale => (
                    <tr key={sale.id}>
                        <td>{sale.id}</td><td>{sale.cliente}</td><td>{sale.quantity}</td>
                        <td>${(sale.totalAmount ?? 0).toFixed(2)}</td><td>{sale.paymentMethod}</td>
                        <td>{new Date(sale.fecha).toLocaleString()}</td>
                        <td>
                            <button type="button" className="btn-action" onClick={() => handleReturn(sale.id)}>Devolver</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
