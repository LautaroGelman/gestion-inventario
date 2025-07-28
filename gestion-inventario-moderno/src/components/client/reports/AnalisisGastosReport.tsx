"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getAnalisisGastos } from '@/services/api';
import { AnalisisGastos } from '@/types/financials';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4242'];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
};

const AnalisisGastosReport = () => {
    const { user } = useAuth();
    const [data, setData] = useState<AnalisisGastos[] | null>(null);
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
            getAnalisisGastos(user.clientId, params)
                .then(response => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching analisis de gastos:", error);
                    setLoading(false);
                });
        }
    }, [user, date]);

    const renderContent = () => {
        if (loading) {
            return <Skeleton className="h-[300px] w-full" />;
        }
        if (!data || data.length === 0) {
            return <p>No hay gastos registrados para el período seleccionado.</p>;
        }
        return (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="monto"
                                nameKey="categoria"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-3">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">% del Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((gasto) => (
                                <TableRow key={gasto.categoria}>
                                    <TableCell>{gasto.categoria}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(gasto.monto)}</TableCell>
                                    <TableCell className="text-right">{gasto.porcentaje.toFixed(2)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Análisis de Gastos</CardTitle>
                    <DateRangePicker date={date} setDate={setDate} />
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default AnalisisGastosReport;