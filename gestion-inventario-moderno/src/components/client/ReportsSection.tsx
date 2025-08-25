// src/components/client/ReportsSection.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section } from "../section";
import EstadoResultadosReport from "./reports/EstadoResultadosReport";
import NominaReport from "./reports/NominaReport";
import FlujoCajaReport from "./reports/FlujoCajaReport";
import AnalisisGastosReport from "./reports/AnalisisGastosReport";
import ValorInventarioReport from "./reports/ValorInventarioReport";
import {
  getDailySalesByDays,
  getProfitabilityLastDays,
  getSalesByEmployee,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VentasChart, { VentasData } from "@/components/ui/VentasChart";
import RentabilidadChart, { ProfitRecord } from "@/components/ui/RentabilidadChart";

// ✅ Acepta clientId opcional para resolver TS2322 cuando se le pasa desde ClientPanelPage
type ReportsSectionProps = {
  clientId?: string | number;
};

// Coincidir con tu DTO de backend (aprox.)
type SalesByEmployeeRow = {
  employeeId?: number | string;
  employeeName: string;
  salesCount: number;
  totalAmount: number;
};

/** Helpers de formato/normalización seguros */
const toNum = (v: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number((v as any) ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (v?: number | null) =>
  toNum(v).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (d: Date, delta: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + delta);
  return nd;
};

const ReportsSection: React.FC<ReportsSectionProps> = ({ clientId }) => {
  const { user } = useAuth();
  const cid = clientId ?? user?.clientId;
  const sucursalId = user?.sucursalId;

  // ------- Estado: Operativos por Sucursal -------
  const [days, setDays] = useState<number>(30);
  const defaultEnd = useMemo(() => todayISO(), []);
  const defaultStart = useMemo(() => addDays(new Date(), -30).toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const [loadingOps, setLoadingOps] = useState<boolean>(false);
  const [opsError, setOpsError] = useState<string>("");

  const [daily, setDaily] = useState<VentasData[] | null>(null);
  const [profit, setProfit] = useState<ProfitRecord[] | null>(null);
  const [byEmployee, setByEmployee] = useState<SalesByEmployeeRow[] | null>(null);

  // Cargar ventas diarias y rentabilidad (por días)
  useEffect(() => {
    if (!cid || !sucursalId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingOps(true);
        setOpsError("");
        const [dRes, pRes] = await Promise.all([
          getDailySalesByDays(cid, sucursalId, days),
          getProfitabilityLastDays(cid, sucursalId, days),
        ]);
        if (!cancelled) {
          setDaily(dRes.data as VentasData[]);
          setProfit(pRes.data as ProfitRecord[]);
        }
      } catch (e: any) {
        if (!cancelled) {
          setOpsError(e?.response?.data?.message ?? "No se pudieron cargar ventas/rentabilidad por sucursal.");
        }
      } finally {
        if (!cancelled) setLoadingOps(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cid, sucursalId, days]);

  // Cargar ventas por empleado (por rango)
  const fetchByEmployee = async () => {
    if (!cid || !sucursalId || !startDate || !endDate) return;
    try {
      setLoadingOps(true);
      setOpsError("");
      const res = await getSalesByEmployee(cid, sucursalId, startDate, endDate);
      // Normaliza a número por si backend envía strings/BigDecimal serializado
      const rows = (res.data as any[]).map((r) => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName ?? "",
        salesCount: toNum(r.salesCount),
        totalAmount: toNum(r.totalAmount),
      })) as SalesByEmployeeRow[];
      setByEmployee(rows);
    } catch (e: any) {
      setOpsError(e?.response?.data?.message ?? "No se pudo cargar ventas por empleado.");
    } finally {
      setLoadingOps(false);
    }
  };

  useEffect(() => {
    // auto-fetch inicial por rango
    fetchByEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, sucursalId]);

  if (!cid) {
    return (
      <Section title="Reportes Financieros y Contabilidad">
        <div className="p-3 rounded border bg-card/50 text-sm">
          Falta <code>clientId</code> para cargar los reportes.
        </div>
      </Section>
    );
  }

  return (
    <Section title="Reportes">
      {/* ──────────────────────────────────────────────────────────
          BLOQUE 1: Reportes FINANCIEROS (agregados por CLIENTE)
          ────────────────────────────────────────────────────────── */}
      <div className="mb-3 text-xs text-muted-foreground">
        <span className="font-medium">Financieros (Cliente #{cid})</span>: datos agregados de todas las sucursales.
      </div>

      <Tabs defaultValue="estado-resultados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger value="estado-resultados">Estado de Resultados</TabsTrigger>
          <TabsTrigger value="nomina">Nómina</TabsTrigger>
          <TabsTrigger value="flujo-caja">Flujo de Caja</TabsTrigger>
          <TabsTrigger value="analisis-gastos">Análisis de Gastos</TabsTrigger>
          <TabsTrigger value="valor-inventario">Valor de Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="estado-resultados">
          <EstadoResultadosReport />
        </TabsContent>
        <TabsContent value="nomina">
          <NominaReport />
        </TabsContent>
        <TabsContent value="flujo-caja">
          <FlujoCajaReport />
        </TabsContent>
        <TabsContent value="analisis-gastos">
          <AnalisisGastosReport />
        </TabsContent>
        <TabsContent value="valor-inventario">
          <ValorInventarioReport />
        </TabsContent>
      </Tabs>

      {/* Divider */}
      <div className="h-6" />

      {/* ──────────────────────────────────────────────────────────
          BLOQUE 2: Reportes OPERATIVOS por SUCURSAL
          ────────────────────────────────────────────────────────── */}
      <div className="mb-3 text-xs text-muted-foreground">
        <span className="font-medium">Operativos por Sucursal</span>: requieren una sucursal seleccionada.
      </div>

      {!sucursalId ? (
        <div className="p-3 rounded border bg-card/50 text-sm">
          Seleccioná una <span className="font-medium">Sucursal</span> en el encabezado para ver los reportes operativos.
        </div>
      ) : (
        <Tabs defaultValue="ventas-diarias" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-4">
            <TabsTrigger value="ventas-diarias">Ventas diarias</TabsTrigger>
            <TabsTrigger value="rentabilidad-dias">Rentabilidad (días)</TabsTrigger>
            <TabsTrigger value="ventas-por-empleado">Ventas por empleado</TabsTrigger>
          </TabsList>

          {/* Ventas diarias (por días) */}
          <TabsContent value="ventas-diarias">
            <div className="flex items-end gap-2 mb-3">
              <div className="text-sm text-muted-foreground">Últimos</div>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value || 1)))}
              />
              <div className="text-sm text-muted-foreground">días</div>
            </div>

            <Card className="rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
              <CardHeader>
                <CardTitle>Ventas e Ingresos (últimos {days} días)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] p-0 pr-4">
                <div className="h-full w-full">
                  {loadingOps ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : daily ? (
                    <VentasChart data={daily} />
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Sin datos.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rentabilidad (por días) */}
          <TabsContent value="rentabilidad-dias">
            <div className="flex items-end gap-2 mb-3">
              <div className="text-sm text-muted-foreground">Últimos</div>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value || 1)))}
              />
              <div className="text-sm text-muted-foreground">días</div>
            </div>

            <Card className="rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
              <CardHeader>
                <CardTitle>Rentabilidad (últimos {days} días)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] p-0 pr-4">
                <div className="h-full w-full">
                  {loadingOps ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : profit ? (
                    <RentabilidadChart data={profit} />
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Sin datos.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ventas por empleado (por rango) */}
          <TabsContent value="ventas-por-empleado">
            <div className="flex flex-wrap items-end gap-2 mb-3">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Desde</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-1">Hasta</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button onClick={fetchByEmployee} disabled={loadingOps}>
                Aplicar
              </Button>
            </div>

            <Card className="rounded-xl border border-gray-100 shadow-sm dark:border-gray-800">
              <CardHeader>
                <CardTitle>Ventas por empleado ({startDate} → {endDate})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingOps ? (
                  <div className="p-4"><Skeleton className="h-24 w-full rounded-xl" /></div>
                ) : byEmployee && byEmployee.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">Empleado</th>
                        <th className="text-right p-3">Ventas (Nro)</th>
                        <th className="text-right p-3">Monto</th>
                      </tr>
                      </thead>
                      <tbody>
                      {byEmployee.map((row, idx) => (
                        <tr key={row.employeeId ?? idx} className="border-b last:border-0">
                          <td className="p-3">{row.employeeName}</td>
                          <td className="p-3 text-right">{toNum(row.salesCount)}</td>
                          <td className="p-3 text-right">${fmt(row.totalAmount)}</td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">Sin datos para el rango seleccionado.</div>
                )}
              </CardContent>
            </Card>

            {!!opsError && (
              <div className="mt-3 p-3 rounded border bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200 text-sm">
                {opsError}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Section>
  );
};

export default ReportsSection;
