// src/components/ReturnFormPage.tsx
'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSaleById, createSaleReturn } from '@/services/api';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Undo2 } from 'lucide-react';

// Tipos alineados al backend de multi-sucursal
interface SaleItem {
    saleItemId: number;
    productId: number;
    productName?: string;
    quantity: number;
}

interface Sale {
    id: number;
    fecha?: string;      // compat
    saleDate?: string;   // compat
    items: SaleItem[];
}

export default function ReturnFormPage() {
    const { user, isOwner } = useAuth();
    const clientId = user?.clientId;
    const sucursalId = user?.sucursalId ?? null;

    const router = useRouter();
    const pathname = usePathname();

    // SaleId desde la URL (toma el último segmento numérico)
    const saleId = useMemo(() => {
        const last = pathname.split('/').filter(Boolean).pop() ?? '';
        const n = Number(last);
        return Number.isFinite(n) ? n : NaN;
    }, [pathname]);

    const [sale, setSale] = useState<Sale | null>(null);
    const [returnQtyByItem, setReturnQtyByItem] = useState<Record<number, number>>({});
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Guards de contexto
    if (!clientId) {
        return <div className="p-4 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
    }
    if (isOwner && (sucursalId == null || sucursalId === '')) {
        return (
          <div className="p-4 border rounded-md bg-card/50 text-sm">
              Seleccioná una sucursal en el header para procesar devoluciones.
          </div>
        );
    }

    // Cargar venta por CLIENTE + SUCURSAL
    useEffect(() => {
        if (!clientId || !sucursalId || isNaN(saleId)) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await getSaleById(clientId, sucursalId, String(saleId));
                const data = res.data as Sale;
                setSale(data);
            } catch (err: any) {
                setError('No se pudieron cargar los detalles de la venta.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, sucursalId, saleId]);

    const handleQtyChange = (saleItemId: number, max: number, raw: string) => {
        const qty = Math.max(0, Math.min(Number(raw) || 0, max));
        setReturnQtyByItem((prev) => ({ ...prev, [saleItemId]: qty }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clientId || !sucursalId || !sale) {
            setError('Error de contexto (cliente/sucursal/venta).');
            return;
        }

        const items = Object.entries(returnQtyByItem)
          .filter(([, q]) => q > 0)
          .map(([saleItemId, quantity]) => ({ saleItemId: Number(saleItemId), quantity }));

        if (items.length === 0) {
            setError('Indicá al menos una cantidad a devolver.');
            return;
        }
        if (!reason.trim()) {
            setError('El motivo de la devolución es obligatorio.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            // Por multi-sucursal: NO enviar sucursalId en el body
            await createSaleReturn(clientId, sucursalId, {
                saleId: sale.id,
                reason,
                items,
            });
            alert('Devolución registrada correctamente.');
            router.push('/panel'); // o '/panel#returns' según tu navegación
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al procesar la devolución.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6">Cargando devolución…</div>;
    if (error && !sale) return <div className="p-4 text-destructive">{error}</div>;
    if (!sale) return <div className="p-4">Venta no encontrada.</div>;

    const saleDate = sale.saleDate ?? sale.fecha ?? '';

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="mb-4">
              <Button variant="outline" onClick={() => router.back()} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
              </Button>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Procesar Devolución — Venta #{sale.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                      Fecha de venta: {saleDate ? new Date(saleDate).toLocaleString() : '—'}
                  </p>
              </CardHeader>

              <CardContent className="space-y-6">
                  <div className="border rounded-md overflow-hidden">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Producto</TableHead>
                                  <TableHead className="text-center">Cant. Vendida</TableHead>
                                  <TableHead className="w-[180px]">Cant. a Devolver</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {sale.items.map((it) => (
                                <TableRow key={it.saleItemId}>
                                    <TableCell>{it.productName ?? `ID: ${it.productId}`}</TableCell>
                                    <TableCell className="text-center">{it.quantity}</TableCell>
                                    <TableCell>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={it.quantity}
                                          value={returnQtyByItem[it.saleItemId] ?? 0}
                                          onChange={(e) => handleQtyChange(it.saleItemId, it.quantity, e.target.value)}
                                        />
                                    </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-medium">Motivo de la devolución</label>
                      <Textarea
                        placeholder="Describe brevemente el motivo…"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                      />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>

              <CardFooter className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={submitting}>
                      <Undo2 className="h-4 w-4 mr-2" />
                      {submitting ? 'Procesando…' : 'Confirmar Devolución'}
                  </Button>
              </CardFooter>
          </Card>
      </div>
    );
}
