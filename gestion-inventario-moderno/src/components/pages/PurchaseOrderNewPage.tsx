// src/components/pages/PurchaseOrderNewPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getSucursalProviders,
  getPurchaseOrderSuggestions,
  createPurchaseOrder,
  type ProviderLite,
  type SuggestionsResponse,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SearchableProviderSelect from '@/components/ui/SearchableProviderSelect';

type DraftItem = {
  productId: number;
  code: string;
  name: string;
  quantity: number;  // entero > 0
  cost: number;      // >= 0
};

export default function PurchaseOrderNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOwner } = useAuth();

  const clientId = user?.clientId ?? null;
  const sucursalId = useMemo<string | number | null>(() => {
    const v = (user as any)?.sucursalId;
    const s = v === null || v === undefined ? '' : String(v).trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
    return s;
  }, [user?.sucursalId]);

  const providerIdFromQuery = searchParams.get('providerId');

  // Proveedor
  const [providers, setProviders] = useState<ProviderLite[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(providerIdFromQuery ? Number(providerIdFromQuery) : null);

  // Sugerencias / Draft
  const [onlyLowStock, setOnlyLowStock] = useState(true);
  const [limit, setLimit] = useState<number | ''>('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Cargar proveedores vinculados a la sucursal
  useEffect(() => {
    if (!clientId || !sucursalId) return;
    setLoadingProviders(true);
    getSucursalProviders(clientId, sucursalId)
      .then(setProviders)
      .catch(() => setProviders([]))
      .finally(() => setLoadingProviders(false));
  }, [clientId, sucursalId]);

  // Si viene providerId por query y existe en lista, mantenerlo
  useEffect(() => {
    if (!providerIdFromQuery) return;
    const pid = Number(providerIdFromQuery);
    if (providers.find(p => p.id === pid)) {
      setProviderId(pid);
    }
  }, [providerIdFromQuery, providers]);

  const totalItems = items.reduce((acc, it) => acc + (Number.isFinite(it.quantity) ? it.quantity : 0), 0);
  const totalCost = items.reduce((acc, it) => acc + (Math.max(it.cost, 0) * Math.max(it.quantity, 0)), 0);

  const loadSuggestions = async () => {
    if (!clientId || !sucursalId || !providerId) {
      setErr('Seleccioná un proveedor.');
      return;
    }
    setLoading(true); setErr('');
    try {
      const res: SuggestionsResponse = await getPurchaseOrderSuggestions(
        clientId, sucursalId, providerId,
        { onlyLowStock, limit: typeof limit === 'number' ? limit : undefined }
      );
      const mapped: DraftItem[] = (res.items || []).map(it => ({
        productId: it.productId,
        code: it.code,
        name: it.name,
        quantity: Math.max(it.suggestedQty ?? 0, 0),
        cost: 0, // si querés, luego pre-cargamos el costo con getProductById; por ahora editable
      }));
      setItems(mapped);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'No se pudieron cargar las sugerencias.');
    } finally {
      setLoading(false);
    }
  };

  const setRow = (idx: number, patch: Partial<DraftItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const removeRow = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const addEmptyRow = () => {
    setItems(prev => [
      ...prev,
      { productId: 0, code: '', name: '', quantity: 1, cost: 0 }
    ]);
  };

  const canSubmit = !!providerId && items.length > 0 && items.every(it =>
    Number.isFinite(it.quantity) && it.quantity > 0 &&
    Number.isFinite(it.cost) && it.cost >= 0 &&
    Number.isFinite(it.productId) && it.productId > 0
  );

  const onSubmit = async () => {
    if (!clientId || !sucursalId || !providerId) {
      setErr('Falta proveedor o sucursal.');
      return;
    }
    const body = {
      providerId,
      items: items.map(it => ({
        productId: it.productId,
        quantity: Math.trunc(it.quantity),
        cost: Number(it.cost),
      })),
    };
    setLoading(true); setErr('');
    try {
      const oc = await createPurchaseOrder(clientId, sucursalId, body);
      alert(`OC #${oc.id} creada`);
      // podés redirigir a detalle cuando exista: /purchase-orders/{id}
      router.push('/panel');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'No se pudo crear la orden de compra.');
    } finally {
      setLoading(false);
    }
  };

  // Guards
  if (!clientId) {
    return <div className="p-6 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
  }
  if (isOwner && !sucursalId) {
    return <div className="p-6 text-sm border rounded-md bg-card/50">Seleccioná una sucursal para generar OC.</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-muted/40 p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Orden de Compra</CardTitle>
            <CardDescription>Seleccioná un proveedor, cargá o ajustá los ítems y confirmá.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* Proveedor */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Proveedor</Label>
                <SearchableProviderSelect
                  options={providers.map(p => ({ id: p.id, label: p.label }))}
                  value={providerId}
                  onChange={setProviderId}
                  placeholder={loadingProviders ? 'Cargando proveedores…' : 'Seleccioná proveedor'}
                  disabled={loadingProviders}
                />
                <p className="text-xs text-muted-foreground">
                  Solo se listan proveedores vinculados y activos a esta sucursal.
                </p>
              </div>

              {/* Filtros de sugerencias */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyLowStock}
                    onChange={e => setOnlyLowStock(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Solo stock bajo
                </Label>
                <Label className="flex items-center gap-2">
                  Límite
                  <Input
                    type="number"
                    value={limit}
                    onChange={e => {
                      const v = e.target.value;
                      setLimit(v === '' ? '' : Number(v));
                    }}
                    placeholder="(opcional)"
                    className="h-8 w-32"
                  />
                </Label>
              </div>

              <div className="flex items-end gap-2">
                <Button type="button" onClick={loadSuggestions} disabled={!providerId || loading}>
                  {loading ? 'Cargando…' : 'Cargar sugerencias'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setItems([])} disabled={loading}>
                  Limpiar ítems
                </Button>
              </div>
            </div>

            {/* Tabla de ítems */}
            <div className="rounded border overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 w-28">Product ID</th>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2 w-28">Cantidad</th>
                  <th className="text-left p-2 w-32">Costo</th>
                  <th className="text-right p-2 w-20">Acción</th>
                </tr>
                </thead>
                <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-3 text-muted-foreground">
                      {providerId ? 'No hay ítems cargados. Usá “Cargar sugerencias” o agregá filas manualmente.' : 'Seleccioná un proveedor para ver sugerencias.'}
                    </td>
                  </tr>
                )}
                {items.map((it, idx) => (
                  <tr key={`${it.productId}-${idx}`} className="border-t">
                    <td className="p-2">
                      <Input
                        value={it.productId || ''}
                        onChange={e => setRow(idx, { productId: e.target.value === '' ? 0 : Number(e.target.value) })}
                        type="number"
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={it.code}
                        onChange={e => setRow(idx, { code: e.target.value })}
                        className="h-8"
                        placeholder="(opcional)"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={it.name}
                        onChange={e => setRow(idx, { name: e.target.value })}
                        className="h-8"
                        placeholder="(opcional)"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={it.quantity}
                        onChange={e => setRow(idx, { quantity: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                        type="number"
                        className="h-8"
                        min={0}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={it.cost}
                        onChange={e => setRow(idx, { cost: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                        type="number"
                        step="0.01"
                        className="h-8"
                        min={0}
                      />
                    </td>
                    <td className="p-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => removeRow(idx)}>Quitar</Button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="secondary" onClick={addEmptyRow}>
                Agregar fila
              </Button>
              <div className="text-sm text-right">
                <div><span className="font-medium">Ítems:</span> {items.length} (total unidades: {totalItems})</div>
                <div><span className="font-medium">Total estimado:</span> ${totalCost.toFixed(2)}</div>
              </div>
            </div>

            {err && <p className="text-sm text-destructive">{err}</p>}
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSubmit} disabled={!canSubmit || loading}>
              {loading ? 'Creando…' : 'Crear OC'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
