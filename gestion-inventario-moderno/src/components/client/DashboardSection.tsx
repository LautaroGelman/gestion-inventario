// src/components/client/DashboardSection.tsx
'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientDashboard, getDailySalesSummary, getProfitabilitySummary } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Archive, ShoppingCart, AlertCircle } from 'lucide-react';
import VentasChart, { VentasData } from '@/components/ui/VentasChart';
import RentabilidadChart, { ProfitRecord } from '@/components/ui/RentabilidadChart';

// Interfaz para los datos del dashboard
interface DashboardData {
    lowStock: number;
    salesToday: number;
}

// Componente reutilizable para las tarjetas de estadísticas
const StatCard = ({ title, value, icon, change }: { title: string; value: string | number; icon: ReactNode; change?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {change && <p className="text-xs text-muted-foreground">{change}</p>}
        </CardContent>
    </Card>
);

export default function DashboardSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [dash, setDash] = useState<DashboardData | null>(null);
    const [sales, setSales] = useState<VentasData[] | null>(null);
    const [profit, setProfit] = useState<ProfitRecord[] | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!clientId) return;

        (async () => {
            try {
                setLoading(true);
                // Hacemos las 3 llamadas a la API en paralelo para mayor eficiencia
                const [dRes, sRes, pRes] = await Promise.all([
                    getClientDashboard(clientId),
                    getDailySalesSummary(clientId),
                    getProfitabilitySummary(clientId),
                ]);

                setDash(dRes.data as DashboardData);
                setSales(sRes.data as VentasData[]);
                setProfit(pRes.data as ProfitRecord[]);

            } catch (e: any) {
                console.error('Error fetching dashboard:', e);
                setError(e.response?.data?.message || 'No se pudo cargar la información del dashboard.');
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId]);

    // Extraemos el total de ventas de hoy del resumen de ventas
    const ventasHoyMonto = sales?.find(s => new Date(s.date).toDateString() === new Date().toDateString())?.totalAmount ?? 0;

    if (loading) return <div>Cargando dashboard…</div>;
    if (error) return <div className="p-4 text-red-600 bg-red-100 rounded-md">Error: {error}</div>;

    return (
        <div className="flex flex-col gap-6">
            {/* Encabezado del Dashboard */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Resumen de tu negocio hoy.</p>
            </div>

            {/* Grid de tarjetas de estadísticas */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Ventas Hoy (Monto)"
                    value={`$${ventasHoyMonto.toFixed(2)}`}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Ventas Hoy (Nro)"
                    value={dash?.salesToday ?? 0}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Productos con Stock Bajo"
                    value={dash?.lowStock ?? 0}
                    icon={<Archive className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Alertas Activas"
                    value="0" // Dato de ejemplo, el backend no lo provee aquí
                    icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            {/* Grid de gráficos */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas e Ingresos (30 Días)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {sales ? <VentasChart data={sales} /> : <p>Cargando gráfico...</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Rentabilidad (30 Días)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {profit ? <RentabilidadChart data={profit} /> : <p>Cargando gráfico...</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}