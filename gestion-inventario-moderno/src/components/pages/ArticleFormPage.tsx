// src/components/pages/ArticleFormPage.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductById, createProduct, updateProduct } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from "@/components/ui/textarea";

// Interfaz para los datos del formulario (ahora usa 'quantity')
interface FormData {
    code: string;
    name: string;
    description: string;
    quantity: number; // <-- CAMBIO DE 'stock' A 'quantity'
    cost: number;
    price: number;
}

function ArticleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const productId = searchParams.get('id');
    const isEditing = Boolean(productId);

    // Estado inicial del formulario (ahora usa 'quantity')
    const [formData, setFormData] = useState<FormData>({
        code: '',
        name: '',
        description: '',
        quantity: 0, // <-- CAMBIO DE 'stock' A 'quantity'
        cost: 0,
        price: 0,
    });
    const [loading, setLoading] = useState<boolean>(isEditing);
    const [error, setError] = useState<string>('');

    // Al editar, mapeamos el 'stock' que viene de la API al campo 'quantity' del formulario
    useEffect(() => {
        if (isEditing && user?.clientId && productId) {
            getProductById(user.clientId, productId)
                .then(response => {
                    const { data } = response;
                    setFormData({
                        code: data.code || '',
                        name: data.name || '',
                        description: data.description || '',
                        quantity: data.stock || 0, // <-- MAPEA 'stock' A 'quantity'
                        cost: data.cost || 0,
                        price: data.price || 0,
                    });
                })
                .catch(err => setError('No se pudo cargar el producto para editar.'))
                .finally(() => setLoading(false));
        }
    }, [isEditing, productId, user?.clientId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({
            ...prev,
            [name]: processedValue,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Datos a enviar al backend:", formData); // Mantenemos el log para verificar

        if (!user?.clientId) {
            setError('Error de autenticación.');
            return;
        }

        try {
            setLoading(true);
            const action = isEditing
                ? updateProduct(user.clientId, productId!, formData)
                : createProduct(user.clientId, formData);

            await action;
            router.push('/panel');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ocurrió un error al guardar.');
        } finally {
            setLoading(false);
        }
    };

    if (isEditing && loading) {
        return <div className="p-6">Cargando datos del artículo...</div>;
    }

    return (
        <div className="flex justify-center items-start min-h-screen bg-muted/40 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditing ? 'Editar Artículo' : 'Nuevo Artículo'}</CardTitle>
                        <CardDescription>
                            {isEditing ? 'Actualiza los detalles de tu producto.' : 'Completa los datos para crear un nuevo producto.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* ... otros campos sin cambios ... */}
                            <div className="grid gap-2">
                                <Label htmlFor="code">Código</Label>
                                <Input id="code" name="code" value={formData.code} onChange={handleChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe brevemente el producto..." />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* --- CAMBIO EN EL INPUT DE STOCK --- */}
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Stock</Label>
                                <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cost">Costo</Label>
                                <Input id="cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Precio</Label>
                                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                            </div>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Artículo'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

export default function ArticleFormPage() {
    return (
        <Suspense fallback={<div className="p-6">Cargando formulario...</div>}>
            <ArticleForm />
        </Suspense>
    );
}