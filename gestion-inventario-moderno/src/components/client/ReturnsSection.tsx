// src/components/client/ReturnsSection.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    getSaleById,
    createSaleReturn,
    getSaleReturns, // ✅ nuevo: listado por sucursal con filtros
} from '@/services/api';

// UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PlusCircle, Search, Undo2, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

// Helpers locales
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Tipos
interface ReturnRecord {
    saleReturnId: string | number;
    saleId: string | number;
    returnedAt?: string; // ISO
    returnDate?: string; // compat
    reason: string;
}

interface SaleItem {
    saleItemId: number;
    productId: string | number;
    productName?: string;
    quantity: number;
}

interface Sale {
    id: number;
    fecha: string; // ISO
    items: SaleItem[];
}

/* ────────────────────────────────────────────────────────────────
   Lista de Devoluciones (por sucursal)
   ──────────────────────────────────────────────────────────────── */
const ReturnsList = ({ onNewReturnClick }: { onNewReturnClick: () => void }) => {
    const { user, isOwner } = useAuth();
    const clientId = user?.clientId;
    const sucursalId = user?.sucursalId ?? null;

    const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtros simples: últimos 30 días
    const [from, setFrom] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return toYMD(d);
    });
    const [to, setTo] = useState<string>(() => toYMD(new Date()));

    const fetchReturns = async () => {
        if (!clientId) return;
        if (isOwner && (sucursalId == null || sucursalId === '')) {
            setLoading(false);
            setReturnsList([]);
            return;
        }
        if (sucursalId == null || sucursalId === '') return;

        setLoading(true);
        setError('');
        try {
            const { data } = await getSaleReturns(clientId, sucursalId, { from, to });
            setReturnsList(data as ReturnRecord[]);
        } catch (err: any) {
            setError('Error al cargar el historial de devoluciones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, sucursalId]);

    if (!clientId) return <div className="p-4 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
    if (isOwner && (sucursalId == null || sucursalId === '')) {
        return (
          <div className="p-4 border rounded-md bg-card/50 text-sm">
              Seleccioná una sucursal en el header para ver devoluciones.
          </div>
        );
    }

    return (
      <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                  <CardTitle>Historial de Devoluciones</CardTitle>
                  <CardDescription>Consulta todas las devoluciones procesadas (por sucursal).</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-[150px]"
                  />
                  <span className="text-sm text-muted-foreground">a</span>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-[150px]"
                  />
                  <Button variant="outline" onClick={fetchReturns}>Aplicar</Button>
                  <Button onClick={onNewReturnClick}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Devolución</Button>
              </div>
          </CardHeader>
          <CardContent>
              <div className="border rounded-md overflow-hidden">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>ID Devolución</TableHead>
                              <TableHead>ID Venta</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Motivo</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Cargando…</TableCell>
                            </TableRow>
                          )}
                          {error && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-destructive">{error}</TableCell>
                            </TableRow>
                          )}
                          {!loading && !error && returnsList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    No se encontraron devoluciones.
                                </TableCell>
                            </TableRow>
                          )}
                          {!loading && !error && returnsList.map((r) => (
                            <TableRow key={String(r.saleReturnId)}>
                                <TableCell className="font-medium">#{r.saleReturnId}</TableCell>
                                <TableCell>#{r.saleId}</TableCell>
                                <TableCell>
                                    {format(new Date(r.returnDate || r.returnedAt || ''), 'dd/MM/yyyy HH:mm')}
                                </TableCell>
                                <TableCell>{r.reason}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
      </Card>
    );
};

/* ────────────────────────────────────────────────────────────────
   Formulario de Nueva Devolución (por sucursal)
   ──────────────────────────────────────────────────────────────── */
const NewReturnForm = ({ onBackClick }: { onBackClick: () => void }) => {
    const { user, isOwner } = useAuth();
    const clientId = user?.clientId;
    const sucursalId = user?.sucursalId ?? null;

    const [saleId, setSaleId] = useState('');
    const [sale, setSale] = useState<Sale | null>(null);
    const [returnQty, setReturnQty] = useState<Record<number, number>>({});
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!clientId) {
        return <div className="p-4 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
    }
    if (isOwner && (sucursalId == null || sucursalId === '')) {
        return (
          <div className="p-4 border rounded-md bg-card/50 text-sm">
              Seleccioná una sucursal en el header para registrar devoluciones.
          </div>
        );
    }

    const fetchSale = async () => {
        if (!clientId || !sucursalId || !saleId) return;
        setError('');
        setSale(null);
        setReturnQty({});
        setLoading(true);
        try {
            // Ahora la venta se obtiene POR SUCURSAL
            const response = await getSaleById(clientId, sucursalId, saleId);
            setSale(response.data as Sale);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Venta no encontrada o error en la búsqueda.');
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (saleItemId: number, max: number, value: string) => {
        const qty = parseInt(value, 10);
        if (isNaN(qty) || qty < 0 || qty > max) return;
        setReturnQty((prev) => ({ ...prev, [saleItemId]: qty }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clientId || !sucursalId || !sale) return;

        const items = Object.entries(returnQty)
          .filter(([, qty]) => qty > 0)
          .map(([saleItemId, quantity]) => ({ saleItemId: Number(saleItemId), quantity }));

        if (items.length === 0) {
            setError('Debes indicar la cantidad a devolver para al menos un producto.');
            return;
        }
        if (!reason.trim()) {
            setError('El motivo de la devolución es obligatorio.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Endpoint por sucursal (sin enviar sucursalId en body)
            await createSaleReturn(clientId, sucursalId, { saleId: sale.id, reason, items });
            alert('Devolución registrada correctamente.');
            onBackClick(); // Vuelve a la lista
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al registrar la devolución.');
        } finally {
            setLoading(false);
        }
    };

    return (
      <Card>
          <CardHeader>
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={onBackClick} className="h-8 w-8">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                      <CardTitle>Registrar Nueva Devolución</CardTitle>
                      <CardDescription>Busca una venta por su ID para iniciar el proceso.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="ID de la venta"
                    value={saleId}
                    onChange={(e) => setSaleId(e.target.value)}
                    disabled={loading}
                  />
                  <Button onClick={fetchSale} disabled={loading || !saleId}>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar Venta
                  </Button>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              {sale && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="border rounded-md p-4">
                        <h3 className="font-semibold mb-2">Items de la Venta #{sale.id}</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-center">Cant. Vendida</TableHead>
                                    <TableHead className="w-[150px]">Cant. a Devolver</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((it) => (
                                  <TableRow key={it.saleItemId}>
                                      <TableCell>{it.productName || `ID: ${it.productId}`}</TableCell>
                                      <TableCell className="text-center">{it.quantity}</TableCell>
                                      <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            max={it.quantity}
                                            value={returnQty[it.saleItemId] ?? 0}
                                            onChange={(e) => handleQtyChange(it.saleItemId, it.quantity, e.target.value)}
                                          />
                                      </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo de la Devolución</Label>
                        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
                    </div>
                    <CardFooter className="p-0 pt-4 flex justify-end">
                        <Button type="submit" disabled={loading}>
                            <Undo2 className="mr-2 h-4 w-4" /> Registrar Devolución
                        </Button>
                    </CardFooter>
                </form>
              )}
          </CardContent>
      </Card>
    );
};

/* ────────────────────────────────────────────────────────────────
   Componente principal (switch lista <-> formulario)
   ──────────────────────────────────────────────────────────────── */
export default function ReturnsSection() {
    const [mode, setMode] = useState<'list' | 'form'>('list');

    if (mode === 'list') {
        return <ReturnsList onNewReturnClick={() => setMode('form')} />;
    }
    return <NewReturnForm onBackClick={() => setMode('list')} />;
}
