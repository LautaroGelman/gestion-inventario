// src/components/client/SalesSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSales } from '@/services/api';
import { format } from 'date-fns';

// UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Undo2, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// DTO de venta (ajusta si tu backend expone otros nombres)
interface SaleRecord {
    id: number;
    cliente: string;
    quantity: number;
    totalAmount?: number;
    paymentMethod: string;
    fecha: string; // ISO date string
}

export default function SalesSection() {
    const { user, isOwner } = useAuth();
    const clientId = user?.clientId;
    const sucursalId = user?.sucursalId ?? null; // 🔹 requerido por multi-sucursal
    const router = useRouter();

    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!clientId) return;

        // Si es propietario y aún no eligió sucursal, no hacemos fetch
        if (isOwner && (sucursalId == null || sucursalId === '')) {
            setLoading(false);
            setSales([]);
            return;
        }
        if (sucursalId == null || sucursalId === '') return;

        (async () => {
            try {
                setLoading(true);
                // 🔸 Ahora pedimos por CLIENTE + SUCURSAL
                const response = await getSales(clientId, sucursalId);
                setSales(response.data as SaleRecord[]);
                setError('');
            } catch (err: any) {
                console.error('Error fetching sales:', err);
                setError(err?.response?.data?.message || 'No se pudo cargar el historial de ventas.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, sucursalId, isOwner]);

    const handleNewSale = () => {
        router.push('/sale-form');
    };

    const handleReturn = (id: number) => {
        router.push(`/return-form/${id}`);
    };

    // Guards de contexto
    if (!clientId) {
        return <div className="p-4 text-sm">No se encontró <code>clientId</code> en la sesión.</div>;
    }
    if (isOwner && (sucursalId == null || sucursalId === '')) {
        return (
          <div className="p-4 border rounded-md bg-card/50 text-sm">
              Seleccioná una sucursal en el header para ver el historial de ventas.
          </div>
        );
    }

    if (error) return <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error}</div>;

    return (
      <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                  <CardTitle>Historial de Ventas</CardTitle>
                  <CardDescription>Aquí puedes ver todas las ventas registradas de la sucursal seleccionada.</CardDescription>
              </div>
              <Button onClick={handleNewSale} className="flex items-center gap-2">
                  <PlusCircle size={18} />
                  Registrar nueva venta
              </Button>
          </CardHeader>
          <CardContent>
              <div className="border rounded-md">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[80px]">ID</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-center">Items</TableHead>
                              <TableHead>Método</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-center">Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                              <TableRow key={index}>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                              </TableRow>
                            ))
                          ) : sales.length > 0 ? (
                            sales.map((sale) => (
                              <TableRow key={sale.id}>
                                  <TableCell className="font-medium">#{sale.id}</TableCell>
                                  <TableCell>{sale.cliente}</TableCell>
                                  <TableCell className="text-center">{sale.quantity}</TableCell>
                                  <TableCell>{sale.paymentMethod}</TableCell>
                                  <TableCell>{format(new Date(sale.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                      ${(sale.totalAmount ?? 0).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                      <Button variant="outline" size="sm" onClick={() => handleReturn(sale.id)}>
                                          <Undo2 className="h-4 w-4 mr-2" />
                                          Devolver
                                      </Button>
                                  </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    No hay ventas registradas.
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
