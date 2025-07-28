// src/components/client/ProvidersSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProviders } from '@/services/api';

// Importando componentes de UI de shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Building, Edit } from 'lucide-react';

// Interfaz para tipar los datos de un proveedor
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
                setError(err.response?.data?.message || 'No se pudo cargar la lista de proveedores.');
                console.error('Error fetching providers:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    const handleEdit = (providerId: string) => {
        // Redirige al formulario de edición (si existe) o de creación
        // Por ahora, solo tenemos el de creación.
        router.push(`/provider-form?id=${providerId}`);
    };

    const handleNew = () => {
        router.push('/provider-form');
    };

    if (error) return <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error}</div>;

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Proveedores</CardTitle>
                    <CardDescription>Administra los proveedores de tu negocio.</CardDescription>
                </div>
                <Button onClick={handleNew} className="flex items-center gap-2">
                    <PlusCircle size={18} />
                    Nuevo Proveedor
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Términos de Pago</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                // Esqueleto de carga para una mejor UX
                                Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : providers.length > 0 ? (
                                providers.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-medium">{p.name}</td>
                                        <td className="px-4 py-3">{p.contactInfo}</td>
                                        <td className="px-4 py-3">{p.paymentTerms}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(p.id)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                            {/* El botón de eliminar no está habilitado ya que no hay endpoint */}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Estado para cuando no hay proveedores
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Building className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                        No hay proveedores registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}