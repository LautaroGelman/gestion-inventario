// src/components/SaleFormPage.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProducts, createSale } from '@/services/api';

interface Product {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface CartItem extends Product {
    cantidad: number;
}

export default function SaleFormPage() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!clientId) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getProducts(clientId);
                const data = res.data as any[];
                setProducts(
                    data.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        quantity: p.quantity,
                    }))
                );
            } catch (err: any) {
                console.error('Error fetching products:', err);
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const handleAddToCart = (product: Product) => {
        setCart(prev => {
            const exist = prev.find(item => item.id === product.id);
            if (exist) {
                if (exist.cantidad >= product.quantity) {
                    alert(`Sólo quedan ${product.quantity} unidades de ${product.name}`);
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

    const handleUpdateQuantity = (productId: number, newQty: string) => {
        const qty = parseInt(newQty, 10);
        setCart(prev =>
            prev
                .map(item => {
                    if (item.id === productId) {
                        const valid = isNaN(qty) || qty < 1 ? 1 : qty;
                        if (valid > item.quantity) {
                            alert(`Sólo quedan ${item.quantity} unidades de ${item.name}`);
                            return { ...item, cantidad: item.quantity };
                        }
                        return { ...item, cantidad: valid };
                    }
                    return item;
                })
                .filter(item => item.cantidad > 0)
        );
    };

    const calculateSubtotal = (): string =>
        cart
            .reduce((sum, item) => sum + item.price * item.cantidad, 0)
            .toFixed(2);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            alert('Error: No se pudo identificar al cliente.');
            return;
        }
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }

        const now = new Date().toISOString().slice(0, 19);
        const saleData = {
            paymentMethod,
            saleDate: now,
            items: cart.map(item => ({ productId: item.id, quantity: item.cantidad })),
            employeeId: user.employeeId,
        };

        try {
            await createSale(clientId, saleData);
            alert('Venta registrada con éxito');
            router.push('/panel');
        } catch (err: any) {
            console.error('Error creating sale:', err);
            alert('Error al registrar la venta: ' + (err.response?.data?.message || ''));
        }
    };

    if (loading) return <div>Cargando productos...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="container-form">
            <header className="form-header">
                <h1>Punto de Venta</h1>
            </header>
            <div className="pos-layout">
                <section className="product-list-section">
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
                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(product => (
                                <div
                                    key={product.id}
                                    className="product-item"
                                    onClick={() => handleAddToCart(product)}
                                >
                                    <span>{product.name}</span>
                                    <span>Stock: {product.quantity}</span>
                                    <span>${product.price.toFixed(2)}</span>
                                </div>
                            ))}
                    </div>
                </section>

                <form id="form-venta" onSubmit={handleSubmit} className="form-container">
                    <div className="form-group">
                        <label htmlFor="paymentMethod">Método de Pago:</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value as any)}
                            className="customer-input"
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>
                    </div>

                    <div className="cart-items form-group">
                        {cart.length === 0 ? (
                            <p>El carrito está vacío.</p>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <span className="item-name">{item.name}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.cantidad}
                                        onChange={e => handleUpdateQuantity(item.id, e.target.value)}
                                        className="item-quantity"
                                    />
                                    <span className="item-price">
                    ${(item.price * item.cantidad).toFixed(2)}
                  </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-summary form-group">
                        <h3>Subtotal: ${calculateSubtotal()}</h3>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">Registrar Venta</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
