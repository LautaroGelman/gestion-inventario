// src/components/pages/ArticleFormPage.tsx
'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductById, createProduct, updateProduct } from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

interface FormData {
    code: string;
    name: string;
    description: string;
    quantity: number;
    cost: number;
    price: number;
}

function ArticleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isOwner } = useAuth();

    const productId = searchParams.get('id');
    const isEditing = Boolean(productId);

    const clientId = user?.clientId ?? null;

    // 🔒 Normaliza sucursalId (evita "null"/"undefined" string)
    const sucursalId = useMemo<string | number | null>(() => {
        const v = (user as any)?.sucursalId;
        const s = v === null || v === undefined ? '' : String(v).trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
        return s;
    }, [user?.sucursalId]);

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

    // Carga de producto en edición (usa clientId + sucursalId + productId)
    useEffect(() => {
        if (!isEditing) return;
        if (!clientId || !sucursalId || !productId) return;
        setLoading(true);
        getProductById(clientId, sucursalId, productId)
          .then((response) => {
              const { data } = response;
              setFormData({
                  code: data.code ?? '',
                  name: data.name ?? '',
                  description: data.description ?? '',
                  quantity: Number(data.quantity ?? 0), // mapea quantity (no 'stock')
                  cost: Number(data.cost ?? 0),
                  price: Number(data.price ?? 0),
              });
              setError('');
          })
          .catch(() => setError('No se pudo cargar el producto para editar.'))
          .finally(() => setLoading(false));
    }, [isEditing, clientId, sucursalId, productId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
        setFormData((prev) => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientId) {
            setError('Error de autenticación (falta clientId).');
            return;
        }
        if (isOwner && !sucursalId) {
            setError('Seleccioná una sucursal antes de crear/editar el artículo.');
            return;
        }
        if (!sucursalId) {
            setError('Tu usuario no tiene una sucursal asignada.');
            return;
        }

        const payload = {
            code: String(formData.code || '').trim(),
            name: String(formData.name || '').trim(),
            description: String(formData.description || '').trim(),
            quantity: Number(formData.quantity ?? 0),
            cost: Number(formData.cost ?? 0),
            price: Number(formData.price ?? 0),
        };

        try {
            setLoading(true);
            // log útil para DevTools
            console.log('Datos a enviar al backend:', payload);

            if (isEditing && productId) {
                await updateProduct(clientId, sucursalId, productId, payload);
            } else {
                await createProduct(clientId, sucursalId, payload);
            }

            router.push('/panel');
        } catch (err: any) {
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              'Ocurrió un error al guardar.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Guards de contexto
    if (!clientId) {
        return (
          <div className="p-6 text-sm">
              No se encontró <code>clientId</code> en la sesión.
          </div>
        );
    }
    if (isOwner && !sucursalId) {
        return (
          <div className="p-6 text-sm border rounded-md bg-card/50">
              Seleccioná una sucursal en el header para {isEditing ? 'editar' : 'crear'} el artículo.
          </div>
        );
    }

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
                          {isEditing
                            ? 'Actualizá los detalles de tu producto.'
                            : 'Completá los datos para crear un nuevo producto.'}
                      </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                              <Label htmlFor="code">Código</Label>
                              <Input
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="name">Nombre</Label>
                              <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                              />
                          </div>
                      </div>

                      <div className="grid gap-2">
                          <Label htmlFor="description">Descripción</Label>
                          <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe brevemente el producto..."
                          />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="grid gap-2">
                              <Label htmlFor="quantity">Stock</Label>
                              <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="cost">Costo</Label>
                              <Input
                                id="cost"
                                name="cost"
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={handleChange}
                                required
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="price">Precio</Label>
                              <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                required
                              />
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

              <div className="mt-4 text-xs text-muted-foreground">
                  <Link href="/panel" className="underline">Volver al panel</Link>
              </div>
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
