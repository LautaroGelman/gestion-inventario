// src/components/client/ProvidersSection.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProviders, addProvider } from '@/services/api';

// UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Building, Edit, RefreshCw, Download, Search } from 'lucide-react';

// Tipos
interface Provider {
    id: string | number;
    name: string;
    contactInfo?: string;
    paymentTerms?: string;
}

type SortKey = 'name' | 'paymentTerms';

export default function ProvidersSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const router = useRouter();

    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // UX extra
    const [query, setQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Crear proveedor inline
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newProvider, setNewProvider] = useState<{ name: string; contactInfo: string; paymentTerms: string }>({
        name: '',
        contactInfo: '',
        paymentTerms: '',
    });

    useEffect(() => {
        if (!clientId) return;
        void loadProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId]);

    const loadProviders = async () => {
        if (!clientId) return;
        setError('');
        setLoading(true);
        try {
            const { data } = await getProviders(clientId);
            setProviders(
              (data as any[]).map((p) => ({
                  id: p.id,
                  name: p.name ?? '',
                  contactInfo: p.contactInfo ?? p.contact ?? '',
                  paymentTerms: p.paymentTerms ?? p.terms ?? '',
              }))
            );
        } catch (err: any) {
            console.error('Error fetching providers:', err);
            setError(err?.response?.data?.message || 'No se pudo cargar la lista de proveedores.');
        } finally {
            setLoading(false);
        }
    };

    // Filtrado + orden + paginación (client-side)
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return providers.filter((p) => {
            if (!q) return true;
            return (
              String(p.name || '').toLowerCase().includes(q) ||
              String(p.contactInfo || '').toLowerCase().includes(q) ||
              String(p.paymentTerms || '').toLowerCase().includes(q)
            );
        });
    }, [providers, query]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            const av = String(a[sortKey] || '').toLowerCase();
            const bv = String(b[sortKey] || '').toLowerCase();
            if (av < bv) return sortAsc ? -1 : 1;
            if (av > bv) return sortAsc ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortKey, sortAsc]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sorted.slice(start, start + pageSize);
    }, [sorted, page]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc((s) => !s);
        else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handleEdit = (providerId: string | number) => {
        router.push(`/provider-form?id=${providerId}`);
    };

    const handleNew = () => {
        setShowCreate((v) => !v);
    };

    const submitCreate = async () => {
        if (!clientId) return;
        if (!newProvider.name.trim()) {
            alert('El nombre es obligatorio.');
            return;
        }
        setCreating(true);
        setError('');
        try {
            await addProvider(clientId, {
                name: newProvider.name,
                contactInfo: newProvider.contactInfo || undefined,
                paymentTerms: newProvider.paymentTerms || undefined,
            });
            setNewProvider({ name: '', contactInfo: '', paymentTerms: '' });
            setShowCreate(false);
            await loadProviders();
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.message || 'Error al crear el proveedor.');
        } finally {
            setCreating(false);
        }
    };

    const exportCSV = () => {
        const headers = ['id', 'name', 'contactInfo', 'paymentTerms'];
        const rows = providers.map((p) => [p.id, p.name, p.contactInfo ?? '', p.paymentTerms ?? '']);
        const csv =
          headers.join(',') +
          '\n' +
          rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proveedores.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (error) {
        return (
          <Card>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                      <CardTitle>Proveedores</CardTitle>
                      <CardDescription>Administra los proveedores de tu negocio.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={loadProviders}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reintentar
                      </Button>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error}</div>
              </CardContent>
          </Card>
        );
    }

    return (
      <Card>
          <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                      <CardTitle>Proveedores</CardTitle>
                      <CardDescription>Administra los proveedores de tu negocio.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={exportCSV}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar CSV
                      </Button>
                      <Button variant="outline" onClick={loadProviders}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Actualizar
                      </Button>
                      <Button onClick={handleNew} className="flex items-center gap-2">
                          <PlusCircle size={18} />
                          {showCreate ? 'Ocultar' : 'Nuevo Proveedor'}
                      </Button>
                  </div>
              </div>

              <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:flex-initial md:w-[320px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, contacto o términos…"
                        className="pl-8"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                      />
                  </div>
                  <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => toggleSort('name')}>
                          Ordenar por Nombre {sortKey === 'name' ? (sortAsc ? '↑' : '↓') : ''}
                      </Button>
                      <Button variant="ghost" onClick={() => toggleSort('paymentTerms')}>
                          Ordenar por Términos {sortKey === 'paymentTerms' ? (sortAsc ? '↑' : '↓') : ''}
                      </Button>
                  </div>
              </div>

              {/* Formulario inline de creación */}
              {showCreate && (
                <div className="w-full rounded-md border p-4 space-y-3 bg-muted/40">
                    <div className="grid md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label>Nombre</Label>
                            <Input
                              value={newProvider.name}
                              onChange={(e) => setNewProvider((s) => ({ ...s, name: e.target.value }))}
                              placeholder="Ej: Proveedora XYZ"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Contacto</Label>
                            <Input
                              value={newProvider.contactInfo}
                              onChange={(e) => setNewProvider((s) => ({ ...s, contactInfo: e.target.value }))}
                              placeholder="correo@dominio.com | +54 9..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Términos de pago</Label>
                            <Input
                              value={newProvider.paymentTerms}
                              onChange={(e) => setNewProvider((s) => ({ ...s, paymentTerms: e.target.value }))}
                              placeholder="30 días / Contado / etc."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowCreate(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={submitCreate} disabled={creating}>
                            {creating ? 'Guardando…' : 'Guardar'}
                        </Button>
                    </div>
                </div>
              )}
          </CardHeader>

          <CardContent>
              <div className="border rounded-md overflow-hidden">
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
                            Array.from({ length: 5 }).map((_, index) => (
                              <TableRow key={index}>
                                  <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                              </TableRow>
                            ))
                          ) : paged.length > 0 ? (
                            paged.map((p) => (
                              <TableRow key={String(p.id)}>
                                  <TableCell className="font-medium">{p.name}</TableCell>
                                  <TableCell className="whitespace-pre-wrap">{p.contactInfo || '—'}</TableCell>
                                  <TableCell>{p.paymentTerms || '—'}</TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="outline" size="sm" onClick={() => handleEdit(p.id)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar
                                      </Button>
                                      {/* Si algún día hay endpoint DELETE, acá agregamos el botón de eliminar */}
                                  </TableCell>
                              </TableRow>
                            ))
                          ) : (
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

              {/* Paginación simple */}
              {!loading && providers.length > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm">
            <span>
              Página {page} de {pageCount}
            </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= pageCount}
                          onClick={() => setPage((p) => p + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
              )}
          </CardContent>
      </Card>
    );
}
