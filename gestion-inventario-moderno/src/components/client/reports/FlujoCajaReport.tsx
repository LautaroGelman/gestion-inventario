"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getFlujoCaja } from '@/services/api';
import { FlujoCaja } from '@/types/financials';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
};

const FlujoCajaReport = () => {
    const { user } = useAuth();
    const [data, setData] = useState<FlujoCaja | null>(null);
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
            getFlujoCaja(user.clientId, params)
                .then(response => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching flujo de caja:", error);
                    setLoading(false);
                });
        }
    }, [user, date]);

    const renderContent = () => {
        if (loading) {
            return <Skeleton className="h-[400px] w-full" />;
        }
        if (!data) {
            return <p>No hay datos disponibles para el período seleccionado.</p>;
        }
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Entradas de Dinero</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.entradas)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Salidas de Dinero</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-red-500">{formatCurrency(data.salidas)}</p></CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader><CardTitle>Flujo Neto de Caja</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold">{formatCurrency(data.saldoFinal)}</p></CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader><CardTitle>Últimos Movimientos</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead></TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.movimientos.map((mov, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {mov.monto > 0 ? <ArrowUpCircle className="text-green-500"/> : <ArrowDownCircle className="text-red-500"/>}
                                        </TableCell>
                                        <TableCell>{format(new Date(mov.fecha), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>{mov.descripcion}</TableCell>
                                        <TableCell>{mov.categoria}</TableCell>
                                        <TableCell className={`text-right font-semibold ${mov.monto > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(mov.monto)}
                                        </TableCell>
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
                    <CardTitle>Flujo de Caja</CardTitle>
                    <DateRangePicker date={date} setDate={setDate} />
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default FlujoCajaReport;