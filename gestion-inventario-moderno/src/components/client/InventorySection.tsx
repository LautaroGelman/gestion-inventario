// src/components/client/InventorySection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProducts, deleteProduct } from '@/services/api';

// Importamos los componentes de UI que usaremos
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Search } from 'lucide-react';

// Interfaz para tipar los productos según el DTO del backend
interface Product {
    id: string;
    code?: string;
    name?: string;
    description?: string;
    stock?: number;
    price?: number;
    cost?: number; // Añadimos el costo por si se quiere mostrar en el futuro
}

export default function InventorySection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // La lógica para obtener datos se mantiene igual
    useEffect(() => {
        if (!clientId) return;
        (async () => {
            try {
                setLoading(true);
                const response = await getProducts(clientId);
                setItems(response.data as Product[]);
            } catch (err: any) {
                setError(err.response?.data?.message || 'No se pudo cargar el inventario.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const handleDelete = async (productId: string) => {
        if (!clientId || !confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        try {
            await deleteProduct(clientId, productId);
            setItems(current => current.filter(item => item.id !== productId));
        } catch (err: any) {
            alert('Error al eliminar el producto.');
        }
    };

    const handleEdit = (productId: string) => {
        // Asumiendo que tienes una ruta para el formulario de edición
        router.push(`/article-form?id=${productId}`);
    };

    const handleNew = () => {
        router.push('/article-form');
    };

    // Filtrado de items para la búsqueda
    const filteredItems = items.filter(item =>
        (item.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Cargando inventario...</div>;
    if (error) return <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error}</div>;

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1">
                    <CardTitle>Inventario</CardTitle>
                    <p className="text-sm text-muted-foreground">Gestiona todos los productos de tu negocio.</p>
                </div>
                <div className="flex w-full md:w-auto items-center gap-2">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre o código..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleNew} className="flex items-center gap-2">
                        <PlusCircle size={18} />
                        Nuevo artículo
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                            <tr className="text-left text-sm font-medium text-muted-foreground">
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3 hidden md:table-cell">Descripción</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3 text-right">Precio</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="px-4 py-3 font-mono">{item.code}</td>
                                        <td className="px-4 py-3 font-medium">{item.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.description}</td>
                                        <td className="px-4 py-3 text-center">{item.stock}</td>
                                        <td className="px-4 py-3 text-right">${item.price?.toFixed(2) ?? '0.00'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(item.id)}>
                                                    Editar
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}