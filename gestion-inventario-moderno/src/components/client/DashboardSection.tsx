// src/components/client/DashboardSection.tsx
"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getSucursalDashboard,
    getDailySalesByDays,
    getProfitabilityLastDays,
} from "@/services/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DollarSign,
    Archive,
    ShoppingCart,
    AlertCircle,
} from "lucide-react";
import VentasChart, { VentasData } from "@/components/ui/VentasChart";
import RentabilidadChart, { ProfitRecord } from "@/components/ui/RentabilidadChart";

// Tipado de la respuesta del backend para métricas rápidas (por sucursal)
interface DashboardData {
    lowStock: number;
    salesToday: number;
}

/** Contenedor circular para iconos */
const IconWrapper = ({ children }: { children: ReactNode }) => (
  <span className="p-2 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
    {children}
  </span>
);

/** Tarjeta reutilizable */
const StatCard = ({
                      title,
                      value,
                      icon,
                      change,
                  }: {
    title: string;
    value: string | number;
    icon: ReactNode;
    change?: string;
}) => (
  <Card className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
          </CardTitle>
          {icon}
      </CardHeader>
      <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {change && <p className="text-xs text-muted-foreground">{change}</p>}
      </CardContent>
  </Card>
);

export default function DashboardSection() {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const sucursalId = user?.sucursalId; // 🔑 ahora todo por sucursal
    const DAYS = 30;

    const [dash, setDash] = useState<DashboardData | null>(null);
    const [sales, setSales] = useState<VentasData[] | null>(null);
    const [profit, setProfit] = useState<ProfitRecord[] | null>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Evita llamadas sin IDs (el contenedor ya hace gateo, pero por las dudas)
        if (!clientId || !sucursalId) return;

        (async () => {
            try {
                setLoading(true);
                const [dRes, sRes, pRes] = await Promise.all([
                    getSucursalDashboard(clientId, sucursalId),
                    getDailySalesByDays(clientId, sucursalId, DAYS),
                    getProfitabilityLastDays(clientId, sucursalId, DAYS),
                ]);

                setDash(dRes.data as DashboardData);
                setSales(sRes.data as VentasData[]);
                setProfit(pRes.data as ProfitRecord[]);
            } catch (e: any) {
                console.error("Error fetching dashboard:", e);
                setError(
                  e?.response?.data?.message ??
                  "No se pudo cargar la información del dashboard."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [clientId, sucursalId]);

    // Monto de ventas de la fecha actual
    const ventasHoyMonto =
      sales?.find(
        (s) => new Date(s.date).toDateString() === new Date().toDateString()
      )?.totalAmount ?? 0;

    if (error)
        return (
          <div className="p-4 text-red-600 bg-red-100 rounded-md dark:bg-red-950">
              Error: {error}
          </div>
        );

    return (
      <div className="max-w-[1300px] mx-auto flex flex-col gap-8 px-6 lg:px-8">
          {/* Encabezado */}
          <header>
              <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                  Resumen de tu negocio hoy
              </p>
          </header>

          {/* Métricas rápidas */}
          <section className="grid gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
                ))
              ) : (
                <>
                    <StatCard
                      title="Ventas Hoy"
                      value={`$${ventasHoyMonto.toFixed(2)}`}
                      icon={
                          <IconWrapper>
                              <DollarSign className="h-4 w-4" />
                          </IconWrapper>
                      }
                      change="+20% desde ayer"
                    />
                    <StatCard
                      title="Ventas (Nro)"
                      value={dash?.salesToday ?? 0}
                      icon={
                          <IconWrapper>
                              <ShoppingCart className="h-4 w-4" />
                          </IconWrapper>
                      }
                      change="+12% desde ayer"
                    />
                    <StatCard
                      title="Stock Bajo"
                      value={dash?.lowStock ?? 0}
                      icon={
                          <IconWrapper>
                              <Archive className="h-4 w-4" />
                          </IconWrapper>
                      }
                    />
                    <StatCard
                      title="Alertas"
                      value="0"
                      icon={
                          <IconWrapper>
                              <AlertCircle className="h-4 w-4" />
                          </IconWrapper>
                      }
                    />
                </>
              )}
          </section>

          {/* Gráficos */}
          <section className="grid gap-6 lg:gap-8 lg:grid-cols-2">
              <Card className="rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
                  <CardHeader>
                      <CardTitle>Ventas e Ingresos ({DAYS} Días)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] p-0 pr-4">
                      <div className="h-full w-full">
                          {loading ? (
                            <Skeleton className="h-full w-full rounded-xl" />
                          ) : sales ? (
                            <VentasChart data={sales} />
                          ) : null}
                      </div>
                  </CardContent>
              </Card>

              <Card className="rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
                  <CardHeader>
                      <CardTitle>Rentabilidad ({DAYS} Días)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] p-0 pr-4">
                      <div className="h-full w-full">
                          {loading ? (
                            <Skeleton className="h-full w-full rounded-xl" />
                          ) : profit ? (
                            <RentabilidadChart data={profit} />
                          ) : null}
                      </div>
                  </CardContent>
              </Card>
          </section>
      </div>
    );
}
