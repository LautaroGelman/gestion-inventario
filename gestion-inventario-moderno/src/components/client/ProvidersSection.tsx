// src/components/client/ProvidersSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProviders } from '@/services/api';

interface Provider {
    id: string;
    name: string;
    contactInfo?: string;
    paymentTerms?: string;
}

export default function ProvidersSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!clientId) return;
        (async () => {
            try {
                setLoading(true);
                const response = await getProviders(clientId);
                setProviders(response.data as Provider[]);
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    'No se pudo cargar la lista de proveedores.'
                );
                console.error('Error fetching providers:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const handleEdit = (providerId: string) => {
        router.push(`/form-proveedor/${providerId}`);
    };

    const handleNew = () => {
        router.push('/form-proveedor');
    };

    if (loading) return <div>Cargando proveedores...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="inventory-section">
            <div className="section-header">
                <h2>Proveedores</h2>
                <button className="btn-new" onClick={handleNew}>
                    Nuevo Proveedor
                </button>
            </div>

            <table>
                <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Términos de Pago</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {providers.map(p => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.contactInfo}</td>
                        <td>{p.paymentTerms}</td>
                        <td>
                            <button
                                className="btn-edit"
                                onClick={() => handleEdit(p.id)}
                            >
                                Editar
                            </button>
                            {/* Eliminar no habilitado */}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
