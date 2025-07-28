"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getEstadoResultados } from '@/services/api';
import { EstadoResultados } from '@/types/financials';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
};

const EstadoResultadosReport = () => {
    const { user } = useAuth();
    const [data, setData] = useState<EstadoResultados | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    useEffect(() => {
        if (user?.clientId && date?.from && date.to) {
            setLoading(true);
            const params = {
                from: format(date.from, 'yyyy-MM-dd'),
                to: format(date.to, 'yyyy-MM-dd'),
            };
            getEstadoResultados(user.clientId, params)
                .then(response => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching estado de resultados:", error);
                    setLoading(false);
                });
        }
    }, [user, date]);

    const renderContent = () => {
        if (loading) {
            return <Skeleton className="h-[300px] w-full" />;
        }
        if (!data) {
            return <p>No hay datos disponibles para el período seleccionado.</p>;
        }
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Ingresos por Ventas</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.ingresosPorVentas)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Costo Mercadería Vendida</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-red-500">{formatCurrency(data.costoMercaderiaVendida)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Margen Bruto</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{formatCurrency(data.margenBruto)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Gastos Operativos</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-red-500">{formatCurrency(data.gastosOperativos)}</p></CardContent>
                    </Card>
                    <Card className="md:col-span-2 lg:col-span-1 bg-primary text-primary-foreground">
                        <CardHeader><CardTitle>Utilidad Operativa</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold">{formatCurrency(data.utilidadOperativa)}</p></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Desglose de Gastos Operativos</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(data.detalleGastos).map(([categoria, monto]) => (
                                    <TableRow key={categoria}>
                                        <TableCell>{categoria}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(monto)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Estado de Resultados (P&L)</CardTitle>
                    <DateRangePicker date={date} setDate={setDate} />
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default EstadoResultadosReport;