// src/components/ProviderFormPage.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addProvider } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface ProviderFormData {
    name: string;
    contactInfo: string;
    paymentTerms: string;
}

export default function ProviderFormPage() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [formData, setFormData] = useState<ProviderFormData>({
        name: '',
        contactInfo: '',
        paymentTerms: '',
    });
    const [error, setError] = useState<string>('');

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value } as ProviderFormData));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!clientId) {
            setError('No se pudo identificar al cliente. Por favor, recarga la página.');
            return;
        }

        try {
            await addProvider(clientId, formData);
            alert('Proveedor creado con éxito');
            router.push('/panel#providers');
        } catch (err: any) {
            console.error('Error creating provider:', err);
            setError(err.response?.data?.message || 'Error al guardar el proveedor.');
        }
    };

    return (
        <div className="container-form">
            <header className="form-header">
                <h1>Nuevo Proveedor</h1>
            </header>
            <main>
                <form id="form-proveedor" onSubmit={handleSubmit}>
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

                    <div className="form-group">
                        <label htmlFor="contactInfo">Información de Contacto:</label>
                        <textarea
                            id="contactInfo"
                            name="contactInfo"
                            value={formData.contactInfo}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="paymentTerms">Términos de Pago:</label>
                        <textarea
                            id="paymentTerms"
                            name="paymentTerms"
                            value={formData.paymentTerms}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="form-actions">
                        <button type="submit" className="btn-submit">Guardar</button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => router.push('/panel#providers')}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
