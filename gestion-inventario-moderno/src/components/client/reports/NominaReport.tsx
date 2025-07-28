"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { addDays, format, startOfMonth } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getNomina } from '@/services/api';
import { Nomina } from '@/types/financials';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
};

const NominaReport = () => {
    const { user } = useAuth();
    const [data, setData] = useState<Nomina | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: startOfMonth(addDays(new Date(), -30)),
        to: new Date(),
    });

    useEffect(() => {
        if (user?.clientId && date?.from && date.to) {
            setLoading(true);
            const params = {
                from: format(date.from, 'yyyy-MM-dd'),
                to: format(date.to, 'yyyy-MM-dd'),
            };
            getNomina(user.clientId, params)
                .then(response => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching nomina:", error);
                    setLoading(false);
                });
        }
    }, [user, date]);

    const renderContent = () => {
        if (loading) {
            return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
            </div>;
        }
        if (!data) {
            return <p>No hay datos disponibles para el período seleccionado.</p>;
        }
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader><CardTitle>Costo Total Nómina</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(data.costoTotalNomina)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Horas Trabajadas</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{data.totalHorasTrabajadas} hs</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Costo Promedio / Hora</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{formatCurrency(data.costoPromedioPorHora)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Costo Laboral / Ingresos</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{data.costoLaboralSobreIngresos.toFixed(2)} %</p></CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Indicadores de Nómina</CardTitle>
                    <DateRangePicker date={date} setDate={setDate} />
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default NominaReport;