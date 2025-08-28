'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSucursalProviders } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

interface ProviderRow {
    id: number;
    name: string;
    contact?: string;
    email?: string;
    address?: string;
    active?: boolean;
}

export default function ProvidersSection() {
    const { user, isOwner } = useAuth();
    const router = useRouter();

    const clientId = user?.clientId ?? null;
    const sucursalId = useMemo<string | number | null>(() => {
        const v = (user as any)?.sucursalId;
        const s = v == null ? '' : String(v).trim();
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
        return s;
    }, [user?.sucursalId]);

    const [rows, setRows] = useState<ProviderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!clientId || !sucursalId) return;
        (async () => {
            try {
                setLoading(true);
                const list = await getSucursalProviders(clientId, sucursalId);
                // getSucursalProviders devuelve ProviderLite: { id, label, raw, active... }
                // 'raw' viene del backend con contact, email, address, etc. por el DTO actualizado
                setRows(
                  list.map((p) => ({
                      id: p.id,
                      name: p.label,
                      contact: p.raw?.contact ?? '',
                      email: p.raw?.email ?? '',
                      address: p.raw?.address ?? '',
                      active: p.active,
                  }))
                );
                setError('');
            } catch (e: any) {
                setError(e?.response?.data?.message || 'No se pudieron cargar los proveedores.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, sucursalId]);

    const onNew = () => router.push('/provider-form');

    if (!clientId) return <div className="p-4">Falta clientId en sesión</div>;
    if (isOwner && !sucursalId)
        return <div className="p-4 border rounded bg-card/50">Seleccioná sucursal en el header.</div>;
    if (loading) return <div className="p-4">Cargando proveedores…</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
      <Card>
          <CardHeader className="flex items-center justify-between">
              <CardTitle>Proveedores de la sucursal</CardTitle>
              <Button onClick={onNew}>
                  <PlusCircle className="mr-1" /> Nuevo proveedor
              </Button>
          </CardHeader>

          <CardContent>
              <div className="border rounded overflow-x-auto">
                  <table className="min-w-full text-sm">
                      <thead className="bg-muted/50">
                      <tr>
                          <th className="px-3 py-2">Nombre</th>
                          <th className="px-3 py-2">Contacto</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Dirección</th>
                      </tr>
                      </thead>
                      <tbody>
                      {rows.length ? (
                        rows.map((p) => (
                          <tr key={p.id} className="border-t">
                              <td className="px-3 py-2">{p.name}</td>
                              <td className="px-3 py-2">{p.contact}</td>
                              <td className="px-3 py-2">{p.email}</td>
                              <td className="px-3 py-2">{p.address}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                No hay proveedores vinculados a esta sucursal.
                            </td>
                        </tr>
                      )}
                      </tbody>
                  </table>
              </div>
          </CardContent>
      </Card>
    );
}
