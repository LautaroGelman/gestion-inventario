// src/components/client/InventorySection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProducts, deleteProduct } from '@/services/api';

interface Product {
    id: string;
    code?: string;
    name?: string;
    description?: string;
    stock?: number;
    price?: number;
}

export default function InventorySection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        if (!clientId) return;
        (async () => {
            try {
                setLoading(true);
                const response = await getProducts(clientId);
                setItems(response.data as Product[]);
            } catch (err: any) {
                setError(err.response?.data?.message || 'No se pudo cargar el inventario.');
                console.error('Error fetching inventory:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const handleDelete = async (productId: string) => {
        if (!clientId) {
            alert('Error: No se pudo identificar al cliente.');
            return;
        }
        if (!confirm('¿Estás seguro de que quieres eliminar el producto?')) return;
        try {
            await deleteProduct(clientId, productId);
            setItems(current => current.filter(item => item.id !== productId));
        } catch (err: any) {
            alert('Error al eliminar el producto: ' + (err.response?.data?.message || 'Error desconocido.'));
            console.error('Error deleting product:', err);
        }
    };

    const handleEdit = (productId: string) => {
        router.push(`/inventory-form/${productId}`);
    };

    const handleNew = () => {
        router.push('/inventory-form');
    };

    const filteredItems = items.filter(item =>
        (item.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Cargando inventario...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="inventory-section">
            <div className="section-header">
                <h2>Inventario</h2>
                <button className="btn-new" onClick={handleNew}>
                    Nuevo artículo
                </button>
            </div>

            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <table>
                <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {filteredItems.map(it => (
                    <tr key={it.id}>
                        <td>{it.code}</td>
                        <td>{it.name}</td>
                        <td>{it.description}</td>
                        <td>{it.stock}</td>
                        <td>${it.price?.toFixed(2) ?? '0.00'}</td>
                        <td>
                            <button className="btn-edit" onClick={() => handleEdit(it.id)}>
                                Editar
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(it.id)}>
                                Eliminar
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
