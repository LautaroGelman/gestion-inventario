'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/api';

interface FormData {
    name: string;
    email: string;
    password: string;
    telefono: string;
    plan: 'BASICO' | 'INTERMEDIO' | 'PREMIUM';
}

export default function ClientFormPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        telefono: '',
        plan: 'BASICO',
    });
    const [error, setError] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!formData.password) {
            setError('La contraseña es obligatoria para nuevos clientes.');
            return;
        }

        try {
            await createClient(formData);

            // Redirijo a /admin con query params para que AdminPage lea sección y mensaje
            const params = new URLSearchParams({
                section: 'cuentas',
                message: 'Cliente creado exitosamente.',
                type: 'success',
            }).toString();

            router.push(`/admin?${params}`);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Error al crear el cliente.');
            console.error('Error al crear cliente:', err);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Registro de Cliente</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block mb-1">Nombre completo</label>
                    <input
                        id="name" name="name" type="text"
                        className="w-full border rounded p-2"
                        onChange={handleChange} value={formData.name} required
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block mb-1">Correo electrónico</label>
                    <input
                        id="email" name="email" type="email"
                        className="w-full border rounded p-2"
                        onChange={handleChange} value={formData.email} required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block mb-1">Contraseña</label>
                    <input
                        id="password" name="password" type="password"
                        className="w-full border rounded p-2"
                        onChange={handleChange} value={formData.password} required
                    />
                </div>

                <div>
                    <label htmlFor="telefono" className="block mb-1">Teléfono</label>
                    <input
                        id="telefono" name="telefono" type="text"
                        className="w-full border rounded p-2"
                        onChange={handleChange} value={formData.telefono}
                    />
                </div>

                <div>
                    <label htmlFor="plan" className="block mb-1">Plan asignado</label>
                    <select
                        id="plan" name="plan"
                        className="w-full border rounded p-2"
                        onChange={handleChange} value={formData.plan}
                    >
                        <option value="BASICO">Básico</option>
                        <option value="INTERMEDIO">Intermedio</option>
                        <option value="PREMIUM">Premium</option>
                    </select>
                </div>

                {error && <p className="text-red-600">{error}</p>}

                <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                        Guardar Cliente
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 border rounded"
                        onClick={() => router.push('/admin?section=cuentas')}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}
