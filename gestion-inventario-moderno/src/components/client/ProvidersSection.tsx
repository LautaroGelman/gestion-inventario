'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    getProviders, addProvider,
    getSucursalProviders, linkProviderToBranch, unlinkProviderFromBranch,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProviderDto = { id: number|string; name?: string; address?: string };

export default function ProvidersSection() {
    const { user } = useAuth();
    const clientId = user?.clientId!;
    const sucursalId = user?.sucursalId ?? null;

    // pestañas: 'cliente' (todos) | 'sucursal' (vinculados a sucursal)
    const [tab, setTab] = useState<'sucursal'|'cliente'>('sucursal');

    // cliente
    const [allProviders, setAllProviders] = useState<ProviderDto[]>([]);
    // sucursal
    const [branchProviders, setBranchProviders] = useState<ProviderDto[]>([]);

    // crear proveedor (cliente)
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const linkedIds = useMemo(
      () => new Set(branchProviders.map(p => String(p.id))),
      [branchProviders]
    );

    const loadAll = async () => {
        if (!clientId) return;
        setLoading(true); setErr('');
        try {
            const [allRes, brRes] = await Promise.all([
                getProviders(clientId),
                sucursalId ? getSucursalProviders(clientId, sucursalId) : Promise.resolve({ data: [] })
            ]);
            setAllProviders(Array.isArray(allRes.data) ? allRes.data : []);
            setBranchProviders(Array.isArray(brRes.data) ? brRes.data : []);
        } catch (e:any) {
            setErr(e?.response?.data?.message || 'No se pudieron cargar los proveedores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void loadAll(); }, [clientId, sucursalId]);

    const onCreate = async () => {
        if (!clientId) return;
        setLoading(true); setErr('');
        try {
            await addProvider(clientId, { name: name || undefined, address: address || undefined });
            setName(''); setAddress('');
            await loadAll();
            setTab('cliente');
        } catch (e:any) {
            setErr(e?.response?.data?.message || 'No se pudo crear el proveedor.');
        } finally {
            setLoading(false);
        }
    };

    const onLink = async (providerId: string|number) => {
        if (!clientId || !sucursalId) return;
        setLoading(true); setErr('');
        try {
            await linkProviderToBranch(clientId, sucursalId, providerId);
            await loadAll();
            setTab('sucursal');
        } catch (e:any) {
            setErr(e?.response?.data?.message || 'No se pudo vincular el proveedor.');
        } finally {
            setLoading(false);
        }
    };

    const onUnlink = async (providerId: string|number) => {
        if (!clientId || !sucursalId) return;
        setLoading(true); setErr('');
        try {
            await unlinkProviderFromBranch(clientId, sucursalId, providerId);
            await loadAll();
        } catch (e:any) {
            setErr(e?.response?.data?.message || 'No se pudo desvincular el proveedor.');
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="space-y-6">
          <header className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                  <h2 className="text-xl font-semibold">Proveedores</h2>
                  <p className="text-sm text-muted-foreground">
                      Gestioná proveedores del cliente y vinculalos a la sucursal actual.
                  </p>
              </div>
              <div className="inline-flex rounded-md border overflow-hidden">
                  <button
                    className={`px-3 py-2 text-sm ${tab==='sucursal'?'bg-primary text-primary-foreground':'hover:bg-accent'}`}
                    onClick={() => setTab('sucursal')}
                    disabled={!sucursalId}
                    title={!sucursalId ? 'Selecciona una sucursal' : 'Proveedores de esta sucursal'}
                  >
                      Sucursal actual
                  </button>
                  <button
                    className={`px-3 py-2 text-sm ${tab==='cliente'?'bg-primary text-primary-foreground':'hover:bg-accent'}`}
                    onClick={() => setTab('cliente')}
                  >
                      Todos (cliente)
                  </button>
              </div>
          </header>

          {err && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{err}</div>}

          {/* Crear proveedor (nivel cliente) */}
          <div className="flex items-end gap-3">
              <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Proveedor S.A." />
              </div>
              <div className="space-y-1">
                  <Label>Dirección</Label>
                  <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Calle 123" />
              </div>
              <Button onClick={onCreate} disabled={loading}>Agregar</Button>
          </div>

          {/* Listas */}
          {tab === 'cliente' ? (
            <div className="rounded border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Nombre</th>
                        <th className="text-left p-2">Dirección</th>
                        <th className="text-right p-2 w-40">{sucursalId ? 'Vincular' : ''}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {allProviders.length===0 && (
                      <tr><td className="p-3 text-muted-foreground" colSpan={4}>{loading?'Cargando…':'Sin proveedores'}</td></tr>
                    )}
                    {allProviders.map(p => {
                        const linked = linkedIds.has(String(p.id));
                        return (
                          <tr key={String(p.id)} className="border-t">
                              <td className="p-2">{String(p.id)}</td>
                              <td className="p-2">{p.name || '—'}</td>
                              <td className="p-2">{p.address || '—'}</td>
                              <td className="p-2 text-right">
                                  {sucursalId && (
                                    linked
                                      ? <Button variant="outline" size="sm" onClick={()=>onUnlink(p.id)} disabled={loading}>Desvincular</Button>
                                      : <Button size="sm" onClick={()=>onLink(p.id)} disabled={loading}>Vincular</Button>
                                  )}
                              </td>
                          </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
          ) : (
            <div className="rounded border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Nombre</th>
                        <th className="text-left p-2">Dirección</th>
                        <th className="text-right p-2 w-40">Acción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {branchProviders.length===0 && (
                      <tr><td className="p-3 text-muted-foreground" colSpan={4}>
                          {loading?'Cargando…':'Esta sucursal no tiene proveedores vinculados'}
                      </td></tr>
                    )}
                    {branchProviders.map(p => (
                      <tr key={String(p.id)} className="border-t">
                          <td className="p-2">{String(p.id)}</td>
                          <td className="p-2">{p.name || '—'}</td>
                          <td className="p-2">{p.address || '—'}</td>
                          <td className="p-2 text-right">
                              {sucursalId && <Button variant="outline" size="sm" onClick={()=>onUnlink(p.id)} disabled={loading}>Desvincular</Button>}
                          </td>
                      </tr>
                    ))}
                    </tbody>
                </table>
            </div>
          )}
      </div>
    );
}
