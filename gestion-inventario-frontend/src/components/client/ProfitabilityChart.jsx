import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos la función para obtener ventas y el hook de autenticación.
import { getSales } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './SalesSection.css';

function SalesSection() {
    const { user } = useAuth(); // Para obtener el clientId
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Nos aseguramos de tener el clientId antes de la llamada
        if (!user?.clientId) return;

        const fetchSales = async () => {
            try {
                setLoading(true);
                // 2. LLAMADA A LA API CORREGIDA:
                //    Usamos la función getSales con el clientId del usuario.
                const response = await getSales(user.clientId);
                setSales(response.data); // La respuesta de Axios está en 'data'
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo cargar el historial de ventas.');
                console.error("Error fetching sales:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, [user]); // El efecto se dispara cuando el 'user' está disponible

    const handleNewSale = () => {
        navigate('/add-sale');
    };

    const handleReturn = (saleId) => {
        navigate(`/return-sale/${saleId}`);
    };

    if (loading) {
        return <div>Cargando ventas...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="sales-section">
            <div className="section-header">
                <h2>Ventas</h2>
                <button className="btn-new" onClick={handleNewSale}>Registrar nueva venta</button>
            </div>
            <table>
                <thead>
                <tr>
                    <th>ID Venta</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {/* El backend devuelve SaleDto con: id, cliente, totalAmount, fecha */}
                {sales.map((sale) => (
                    <tr key={sale.id}>
                        <td>{sale.id}</td>
                        <td>{sale.cliente}</td>
                        <td>${sale.totalAmount.toFixed(2)}</td>
                        <td>{new Date(sale.fecha).toLocaleString()}</td>
                        <td>
                            <button className="btn-action" onClick={() => handleReturn(sale.id)}>
                                Devolver
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default SalesSection;