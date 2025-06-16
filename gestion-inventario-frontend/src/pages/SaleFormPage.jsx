import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. IMPORTACIONES CORREGIDAS:
//    Importamos las funciones para obtener productos y crear ventas, y el hook de autenticación.
import { getProducts, createSale } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SaleFormPage.css';

function SaleFormPage() {
    const { user } = useAuth(); // Para obtener el clientId
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Nos aseguramos de tener el clientId antes de buscar los productos
        if (!user?.clientId) return;

        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                // 2. LLAMADA GET CORREGIDA:
                const response = await getProducts(user.clientId);
                // Los nombres de los productos en el DTO son 'name' y 'price'
                setProducts(response.data.map(p => ({ ...p, nombre: p.name, precio: p.price })));
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [user]); // El efecto depende del 'user'

    const handleAddToCart = (product) => {
        setCart(prevCart => {
            const existingProduct = prevCart.find(item => item.id === product.id);
            if (existingProduct) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, cantidad: 1 }];
            }
        });
    };

    const handleUpdateQuantity = (productId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== productId));
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === productId ? { ...item, cantidad: quantity } : item
                )
            );
        }
    };

    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + item.precio * item.cantidad, 0).toFixed(2);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user?.clientId) {
            alert('Error: No se pudo identificar al cliente. Por favor, recarga la página.');
            return;
        }
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }

        const saleData = {
            // El backend espera 'customer' en lugar de 'cliente'
            customer: customerName || 'Consumidor Final',
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.cantidad, // El backend espera 'quantity'
            }))
        };

        try {
            // 3. LLAMADA POST CORREGIDA:
            await createSale(user.clientId, saleData);
            alert('Venta registrada con éxito');
            navigate('/panel-cliente#sales'); // Redirigimos a la sección de ventas
        } catch (err) {
            console.error('Error creating sale:', err);
            alert('Error al registrar la venta: ' + (err.response?.data?.message || ''));
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div>Cargando productos...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="sale-form-container">
            <h1>Punto de Venta</h1>
            <div className="pos-layout">
                <div className="product-list-section">
                    <h2>Productos</h2>
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="product-list">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="product-item" onClick={() => handleAddToCart(product)}>
                                <span>{product.nombre}</span>
                                <span>${product.precio.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cart-section">
                    <h2>Carrito</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="customer-input-container">
                            <label htmlFor="customerName">Nombre del Cliente (Opcional):</label>
                            <input
                                type="text"
                                id="customerName"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="customer-input"
                            />
                        </div>

                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <p>El carrito está vacío.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <span className="item-name">{item.nombre}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.cantidad}
                                            onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                                            className="item-quantity"
                                        />
                                        <span className="item-price">${(item.precio * item.cantidad).toFixed(2)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="cart-summary">
                            <h3>Subtotal: ${calculateSubtotal()}</h3>
                            <button type="submit" className="submit-button">Registrar Venta</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SaleFormPage;