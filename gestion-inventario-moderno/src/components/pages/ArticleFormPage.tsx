// src/components/pages/ArticleFormPage.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getProductById, createProduct, updateProduct } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface FormData {
    code: string;
    name: string;
    description: string;
    quantity: number;
    cost: number;
    price: number;
}

export default function ArticleFormPage() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();
    const pathname = usePathname();

    // Extraemos el parámetro `[id]` de la URL
    const parts = pathname.split('/');
    const id = parts[parts.length - 1] !== 'inventory-form' ? parts[parts.length - 1] : null;
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        code: '',
        name: '',
        description: '',
        quantity: 0,
        cost: 0,
        price: 0,
    });
    const [loading, setLoading] = useState<boolean>(isEditing);
    const [error, setError] = useState<string>('');

    // Carga inicial en edición
    useEffect(() => {
        if (!isEditing || !clientId || !id) return;

        (async () => {
            try {
                const { data } = await getProductById(clientId, id);
                setFormData({
                    code: data.code ?? '',
                    name: data.name ?? '',
                    description: data.description ?? '',
                    quantity: data.quantity ?? 0,
                    cost: data.cost ?? 0,
                    price: data.price ?? 0,
                });
            } catch (err: any) {
                console.error('Error fetching product:', err);
                setError(err.response?.data?.message || 'No se pudieron cargar los datos del artículo.');
            } finally {
                setLoading(false);
            }
        })();
    }, [isEditing, clientId, id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]:
                type === 'number'
                    ? parseFloat(value) || 0
                    : value,
        } as FormData));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!clientId) {
            setError('No se pudo identificar al cliente. Por favor, recarga la página.');
            return;
        }

        try {
            if (isEditing && id) {
                await updateProduct(clientId, id, formData);
                alert('Artículo actualizado con éxito');
            } else {
                await createProduct(clientId, formData);
                alert('Artículo creado con éxito');
            }
            router.push('/panel#inventory');
        } catch (err: any) {
            console.error('Error saving article:', err);
            setError(err.response?.data?.message || 'Error al guardar el artículo.');
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container-form">
            <header className="form-header">
                <h1>{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
            </header>
            <main>
                <form id="form-articulo" onSubmit={handleSubmit}>
                    {/** Código */}
                    <div className="form-group">
                        <label htmlFor="code">Código:</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/** Nombre */}
                    <div className="form-group">
                        <label htmlFor="name">Nombre:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/** Descripción */}
                    <div className="form-group">
                        <label htmlFor="description">Descripción:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    {/** Stock */}
                    <div className="form-group">
                        <label htmlFor="quantity">Stock:</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            min={0}
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/** Costo */}
                    <div className="form-group">
                        <label htmlFor="cost">Costo:</label>
                        <input
                            type="number"
                            id="cost"
                            name="cost"
                            min={0}
                            step="0.01"
                            value={formData.cost}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/** Precio */}
                    <div className="form-group">
                        <label htmlFor="price">Precio:</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            min={0}
                            step="0.01"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">
                            Guardar
                        </button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => router.push('/panel#inventory')}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
