"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from '@/context/AuthContext';
import { getValorInventario } from '@/services/api';
import { ValorInventario } from '@/types/financials';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
};

const ValorInventarioReport = () => {
    const { user } = useAuth();
    const [data, setData] = useState<ValorInventario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.clientId) {
            setLoading(true);
            getValorInventario(user.clientId)
                .then(response => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching valor de inventario:", error);
                    setLoading(false);
                });
        }
    }, [user]);

    const renderContent = () => {
        if (loading) {
            return <Skeleton className="h-[300px] w-full" />;
        }
        if (!data) {
            return <p>No se pudo calcular el valor del inventario.</p>;
        }
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex items-center justify-center">
                    <Card className="text-center w-full">
                        <CardHeader><CardTitle>Valor Total del Inventario</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-5xl font-bold text-primary">{formatCurrency(data.valorTotalInventario)}</p>
                            <p className="text-muted-foreground mt-2">Costo total de todos los productos en stock.</p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader><CardTitle>Top 5 Productos más Valiosos</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Valor Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topProductosValorizados.map((prod) => (
                                    <TableRow key={prod.nombre}>
                                        <TableCell>{prod.nombre}</TableCell>
                                        <TableCell className="text-right">{prod.stockActual}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(prod.valorTotal)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Valorización de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default ValorInventarioReport;