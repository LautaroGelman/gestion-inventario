// src/components/client/InventorySection.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProducts, deleteProduct } from '@/services/api';

// UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Search } from 'lucide-react';

// DTO local (alineado con backend: quantity)
interface Product {
    id: string | number;
    code?: string;
    name?: string;
    description?: string;
    quantity?: number; // <- antes 'stock'
    price?: number;
    cost?: number;
}

export default function InventorySection() {
    const { user, isOwner } = useAuth();
    const router = useRouter();

    const clientId = user?.clientId ?? null;

    // 🔒 Normalizo sucursalId para evitar "null"/"undefined" como string
    const sucursalId = useMemo<string | number | null>(() => {
        const v = (user as any)?.sucursalId;
        const s = v === null || v === undefined ? '' : String(v).trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
        // Podemos usar string o number; la API acepta ambos. Devuelvo string para evitar NaN.
        return s;
    }, [user?.sucursalId]);

    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Carga por CLIENTE + SUCURSAL
    useEffect(() => {
        if (!clientId) return;

        // propietario sin sucursal seleccionada: no cargamos y mostramos aviso en UI
        if (isOwner && sucursalId == null) {
            setLoading(false);
            setItems([]);
            return;
        }

        if (sucursalId == null) return;

        (async () => {
            try {
                setLoading(true);
                const response = await getProducts(clientId, sucursalId);
                // response.data debe ser ProductDto[] con 'quantity'
                setItems(response.data as Product[]);
                setError('');
            } catch (err: any) {
                // Si api.ts lanzó por mustId, cae acá también
                setError(err?.response?.data?.message || err?.message || 'No se pudo cargar el inventario.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, sucursalId, isOwner]);

    const handleDelete = async (productId: string | number) => {
        if (!clientId || sucursalId == null) return;
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        try {
            await deleteProduct(clientId, sucursalId, productId);
            setItems((current) => current.filter((item) => String(item.id) !== String(productId)));
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Error al eliminar el producto.');
        }
    };

    const handleEdit = (productId: string | number) => {
        router.push(`/article-form?id=${productId}`);
    };

    const handleNew = () => {
        router.push('/article-form');
    };

    // Filtrado de items para la búsqueda
    const filteredItems = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return items.filter((item) => {
            const name = (item.name ?? '').toLowerCase();
            const code = (item.code ?? '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [items, searchTerm]);

    // Estados vacíos / guardas
    if (!clientId) {
        return <div className="p-4 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
    }

    if (isOwner && sucursalId == null) {
        return (
          <div className="p-4 border rounded-md bg-card/50 text-sm">
              Seleccioná una sucursal en el header para ver el inventario.
          </div>
        );
    }

    if (loading) return <div className="p-4 text-sm">Cargando inventario…</div>;

    if (error) {
        return (
          <div className="p-4 text-red-600 bg-red-100 rounded-md">
              Error: {error}
          </div>
        );
    }

    return (
      <Card>
          <CardHeader className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1">
                  <CardTitle>Inventario</CardTitle>
                  <p className="text-sm text-muted-foreground">
                      Gestioná los productos de la sucursal seleccionada.
                  </p>
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
                              <tr key={String(item.id)} className="text-sm">
                                  <td className="px-4 py-3 font-mono">{item.code}</td>
                                  <td className="px-4 py-3 font-medium">{item.name}</td>
                                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                      {item.description}
                                  </td>
                                  <td className="px-4 py-3 text-center">{item.quantity ?? 0}</td>
                                  <td className="px-4 py-3 text-right">
                                      $
                                      {typeof item.price === 'number'
                                        ? item.price.toFixed(2)
                                        : (Number(item.price) || 0).toFixed(2)}
                                  </td>
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
