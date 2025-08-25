// src/components/layout/SucursalSelector.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBranches, createBranch } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, RefreshCw, LogOut, PlusCircle, ArrowLeft } from 'lucide-react';

type Branch = { id: number | string; name?: string; alias?: string };

export default function SucursalSelector() {
  const { user, isOwner, setSucursalId, logout } = useAuth();
  const clientId = user?.clientId;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState('');

  // Estados para overlay (forzado) y creación
  const [creatingMode, setCreatingMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [firstAddress, setFirstAddress] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  // Overlay abierto si:
  // - es owner y aún no cargó, o
  // - no hay sucursales, o
  // - hay sucursales pero no hay selección, o
  // - tocó "Nueva" (creatingMode)
  const overlayOpen = useMemo(() => {
    if (!isOwner) return false;
    if (creatingMode) return true;         // <- abre overlay al pulsar “Nueva”
    if (!loaded) return true;
    if (branches.length === 0) return true;
    if (!user?.sucursalId || user.sucursalId === '') return true;
    return false;
  }, [isOwner, creatingMode, loaded, branches.length, user?.sucursalId]);

  useEffect(() => {
    if (overlayOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [overlayOpen]);

  useEffect(() => {
    if (!clientId || !isOwner) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, isOwner]);

  const load = async () => {
    if (!clientId) return;
    setLoading(true);
    setErr('');
    try {
      const { data } = await getBranches(clientId);
      const list = (data as any[]).map((b) => ({
        id: b.id,
        name: b.name ?? b.nombre ?? b.alias ?? `Sucursal ${b.id}`,
        alias: b.alias ?? b.nombre ?? b.name,
      })) as Branch[];
      setBranches(list);
      setCreatingMode(list.length === 0); // si no hay, arrancar en “crear”; si hay, volver a selección
      if (list.length > 0 && (!user?.sucursalId || user.sucursalId === '')) {
        setSelectedId(String(list[0].id));
      } else {
        setSelectedId(String(user?.sucursalId ?? ''));
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'No se pudieron cargar las sucursales.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const labelById = useMemo(() => {
    const m = new Map<string | number, string>();
    branches.forEach((b) => m.set(b.id, b.name || String(b.id)));
    return m;
  }, [branches]);

  const onConfirmSelect = async () => {
    if (!selectedId) return;
    setSucursalId(selectedId);
    // overlay se cierra por overlayOpen al tener sucursalId
  };

  const onCreateFirst = async () => {
    if (!clientId) return;
    if (!firstName.trim() && !firstAddress.trim()) {
      alert('Ingresá al menos un nombre o una dirección.');
      return;
    }
    setCreating(true);
    setErr('');
    try {
      const { data } = await createBranch(clientId, {
        name: firstName.trim() || undefined,
        address: firstAddress.trim() || undefined,
      });
      await load(); // refrescamos lista/selectedId
      // seleccionar la creada
      const newId = (data?.id ?? data?.branchId) as number | string | undefined;
      if (newId != null) {
        setSucursalId(newId);             // normalizado a string en el contexto
      } else {
        // si el backend no devuelve id, seleccionamos la última del listado
        const latest = branches[branches.length - 1];
        if (latest) setSucursalId(latest.id);
      }
      // limpiar y volver a modo selección
      setFirstName('');
      setFirstAddress('');
      setCreatingMode(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'No se pudo crear la sucursal.');
    } finally {
      setCreating(false);
    }
  };

  // RENDER

  if (!isOwner) {
    if (user?.sucursalId) {
      return (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">
            {labelById.get(user.sucursalId) ?? `Sucursal ${user.sucursalId}`}
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Selector compacto en header */}
      {!overlayOpen && (
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <Select
            value={String(user?.sucursalId ?? '')}
            onValueChange={(val) => setSucursalId(val === '' ? null : val)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={loading ? 'Cargando…' : 'Seleccioná una sucursal'} />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={String(b.id)} value={String(b.id)}>
                  {b.name ?? `Sucursal ${b.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreatingMode(true)}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        </div>
      )}

      {/* Overlay bloqueante */}
      {overlayOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-[101] mx-auto mt-24 w-[92%] max-w-xl rounded-xl border bg-card shadow-xl">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {branches.length === 0 || creatingMode ? 'Crear sucursal' : 'Seleccioná una sucursal'}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {branches.length === 0 || creatingMode
                  ? 'Necesitás al menos una sucursal para comenzar.'
                  : 'Elegí una sucursal para operar. Podés crear otra si lo necesitás.'}
              </p>
            </div>

            <div className="p-5 space-y-5">
              {!loaded ? (
                <p>Cargando sucursales…</p>
              ) : branches.length === 0 || creatingMode ? (
                <>
                  <div className="space-y-2">
                    <Label>Nombre (opcional)</Label>
                    <Input
                      placeholder="Ej: Casa Central"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección (opcional)</Label>
                    <Input
                      placeholder="Calle 123, Ciudad"
                      value={firstAddress}
                      onChange={(e) => setFirstAddress(e.target.value)}
                    />
                  </div>
                  {err && <p className="text-sm text-destructive">{err}</p>}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Seleccioná una sucursal</Label>
                    <Select value={selectedId} onValueChange={(val) => setSelectedId(val)} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegí una sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={String(b.id)} value={String(b.id)}>
                            {b.name ?? `Sucursal ${b.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setCreatingMode(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Crear nueva sucursal
                    </Button>
                    {err && <p className="text-sm text-destructive">{err}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={logout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
                {branches.length > 0 && creatingMode && (
                  <Button variant="ghost" onClick={() => setCreatingMode(false)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Volver a seleccionar
                  </Button>
                )}
              </div>

              {branches.length === 0 || creatingMode ? (
                <Button onClick={onCreateFirst} disabled={creating}>
                  {creating ? 'Creando…' : 'Crear sucursal'}
                </Button>
              ) : (
                <Button onClick={onConfirmSelect} disabled={!selectedId}>
                  Confirmar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
