import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, createSale } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SaleFormPage.css';

function SaleFormPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.clientId) return;
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getProducts(user.clientId);
                setProducts(
                    response.data.map(p => ({
                        ...p,
                        nombre: p.name,
                        precio: p.price,
                        cantidadStock: p.quantity  // incluir stock disponible
                    }))
                );
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]);

    const handleAddToCart = (product) => {
        setCart(prev => {
            const exist = prev.find(item => item.id === product.id);
            if (exist) {
                // no agregar más de lo que hay en stock
                if (exist.cantidad >= product.cantidadStock) {
                    alert(`Sólo quedan ${product.cantidadStock} unidades de ${product.nombre}`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cantidad: 1 }];
        });
    };

    const handleUpdateQuantity = (productId, newQty) => {
        const qty = parseInt(newQty, 10);
        setCart(prev => prev
            .map(item => {
                if (item.id === productId) {
                    const validQty = isNaN(qty) || qty < 1 ? 1 : qty;
                    if (validQty > item.cantidadStock) {
                        alert(`Sólo quedan ${item.cantidadStock} unidades de ${item.nombre}`);
                        return { ...item, cantidad: item.cantidadStock };
                    }
                    return { ...item, cantidad: validQty };
                }
                return item;
            })
            .filter(item => item.cantidad > 0)
        );
    };

    const calculateSubtotal = () =>
        cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0).toFixed(2);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.clientId) {
            alert('Error: No se pudo identificar al cliente.');
            return;
        }
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }

        const now = new Date().toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
        const saleData = {
            paymentMethod,
            saleDate: now,
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.cantidad
            })),
            employeeId: user.employeeId    // siempre incluido
        };

        try {
            await createSale(user.clientId, saleData);
            alert('Venta registrada con éxito');
            navigate('/panel');
        } catch (err) {
            console.error('Error creating sale:', err);
            alert('Error al registrar la venta: ' + (err.response?.data?.message || ''));
        }
    };

    if (loading) return <div>Cargando productos...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container-form">
            <div className="form-header">
                <h1>Punto de Venta</h1>
            </div>
            <div className="pos-layout">
                <div className="product-list-section">
                    <h2>Productos</h2>
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="product-list">
                        {products
                            .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(product => (
                                <div
                                    key={product.id}
                                    className="product-item"
                                    onClick={() => handleAddToCart(product)}
                                >
                                    <span>{product.nombre}</span>
                                    <span>Stock: {product.cantidadStock}</span>
                                    <span>${product.precio.toFixed(2)}</span>
                                </div>
                            ))}
                    </div>
                </div>

                <form id="form-venta" onSubmit={handleSubmit} className="form-container">
                    <div className="form-group">
                        <label htmlFor="paymentMethod">Método de Pago:</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="customer-input"
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <p>El carrito está vacío.</p>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="form-group cart-item">
                                    <span className="item-name">{item.nombre}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.cantidad}
                                        onChange={e => handleUpdateQuantity(item.id, e.target.value)}
                                        className="item-quantity"
                                    />
                                    <span className="item-price">
                                        ${(item.precio * item.cantidad).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-summary form-group">
                        <h3>Subtotal: ${calculateSubtotal()}</h3>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">
                            Registrar Venta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SaleFormPage;

