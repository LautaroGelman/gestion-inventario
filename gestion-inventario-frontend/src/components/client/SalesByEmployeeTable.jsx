import React, { useState, useEffect } from 'react';
// 1. IMPORTACIONES CORREGIDAS:
import { getSalesByEmployee } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function SalesByEmployeeTable({ startDate, endDate }) {
    const { user } = useAuth(); // Para obtener el clientId
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Nos aseguramos de tener toda la información necesaria
        if (user?.clientId && startDate && endDate) {
            const fetchSalesByEmployee = async () => {
                setLoading(true);
                setError('');
                try {
                    // 2. LLAMADA A LA API CORREGIDA:
                    const response = await getSalesByEmployee(user.clientId, startDate, endDate);
                    setSalesData(response.data);
                } catch (err) {
                    console.error("Error fetching sales by employee:", err);
                    setError(err.response?.data?.message || "No se pudieron cargar los datos de ventas.");
                } finally {
                    setLoading(false);
                }
            };
            fetchSalesByEmployee();
        }
    }, [startDate, endDate, user]); // Agregamos 'user' a las dependencias

    if (loading) return <div>Cargando datos...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <table className="report-table">
            <thead>
            <tr>
                <th>Empleado</th>
                <th>N° de Ventas</th>
                <th>Monto Total Vendido</th>
            </tr>
            </thead>
            <tbody>
            {salesData.map(item => (
                <tr key={item.employeeId}>
                    <td>{item.employeeName}</td>
                    <td>{item.salesCount}</td>
                    <td>${item.totalSalesAmount.toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default SalesByEmployeeTable;