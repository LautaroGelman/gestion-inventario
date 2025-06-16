import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS
import { getSaleById, createSaleReturn } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ReturnFormPage.css';

function ReturnFormPage() {
    const { user } = useAuth(); // Para obtener el clientId
    const { saleId } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [returnItems, setReturnItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Nos aseguramos de tener la información necesaria
        if (user?.clientId && saleId) {
            const fetchSaleDetails = async () => {
                try {
                    // 2. LLAMADA GET CORREGIDA
                    //    Nota: Esto fallará hasta que el endpoint GET /sales/{saleId} exista en el backend.
                    const response = await getSaleById(user.clientId, saleId);
                    setSale(response.data);
                } catch (err) {
                    setError('No se pudieron cargar los detalles de la venta. (El endpoint puede no existir en el backend)');
                    console.error("Error fetching sale details:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSaleDetails();
        }
    }, [saleId, user]);

    const handleQuantityChange = (productId, quantity) => {
        const itemInSale = sale.items.find(item => item.product.id === productId);
        if (!itemInSale) return;

        const maxQuantity = itemInSale.quantity; // El DTO usa 'quantity'
        const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
        setReturnItems(prev => ({
            ...prev,
            [productId]: newQuantity,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.clientId) {
            setError('Error de autenticación. No se pudo procesar la devolución.');
            return;
        }

        const itemsToReturn = Object.entries(returnItems)
            .filter(([, quantity]) => quantity > 0)
            .map(([productId, quantity]) => ({
                productId: parseInt(productId),
                quantity,
            }));

        if (itemsToReturn.length === 0) {
            alert('Por favor, selecciona la cantidad de al menos un producto a devolver.');
            return;
        }

        const returnRequest = {
            originalSaleId: parseInt(saleId), // Aseguramos que sea número
            items: itemsToReturn,
        };

        try {
            // 3. LLAMADA POST CORREGIDA
            await createSaleReturn(user.clientId, returnRequest);
            alert('Devolución procesada con éxito.');
            navigate('/panel-cliente#sales');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al procesar la devolución.');
            console.error("Error creating return:", err);
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!sale) return <div>Venta no encontrada.</div>;

    // Los DTOs del backend usan 'product.name' y 'quantity'
    return (
        <div className="return-form-container">
            <h2>Procesar Devolución de Venta #{sale.id}</h2>
            <p><strong>Cliente:</strong> {sale.customer}</p>
            <p><strong>Fecha de Venta:</strong> {new Date(sale.saleDate).toLocaleString()}</p>

            <form onSubmit={handleSubmit}>
                <table className="return-table">
                    <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad Comprada</th>
                        <th>Cantidad a Devolver</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sale.items.map(item => (
                        <tr key={item.product.id}>
                            <td>{item.product.name}</td>
                            <td>{item.quantity}</td>
                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    max={item.quantity}
                                    value={returnItems[item.product.id] || 0}
                                    onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value, 10) || 0)}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button type="submit" className="submit-button">Confirmar Devolución</button>
            </form>
        </div>
    );
}

export default ReturnFormPage;