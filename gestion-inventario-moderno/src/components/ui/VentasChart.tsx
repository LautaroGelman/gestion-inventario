'use client';

import React from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    TooltipProps,
} from 'recharts';
import { format } from 'date-fns';

export interface VentasData {
    date: string;
    salesCount: number;
    totalAmount: number;
}

/* --- Tooltip personalizado tipado --- */
const CustomTooltip = ({
                           active,
                           payload,
                           label,
                       }: TooltipProps<number, string>): JSX.Element | null => {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border bg-background p-3 shadow">
            <p className="text-sm font-semibold">
                {format(new Date(label), 'dd MMM, yyyy')}
            </p>
            <div className="mt-1 space-y-1 text-xs">
                <div className="flex items-center">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                    <span>Ventas: {payload[0].value}</span>
                </div>
                <div className="flex items-center">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Importe: ${Number(payload[1].value).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default function VentasChart({ data }: { data: VentasData[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 20, right: 30, bottom: 10, left: 0 }}
            >
                {/* Gradientes reutilizables */}
                <defs>
                    <linearGradient id="ventasBar" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.9}
                        />
                        <stop
                            offset="100%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.2}
                        />
                    </linearGradient>
                    <linearGradient id="ventasArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="80%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Rejilla sutil */}
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                />

                {/* Ejes */}
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d: string | number | Date) => format(new Date(d), 'dd/MM')}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v: any) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />

                {/* Interactividad */}
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />

                {/* Area suave bajo la línea de importe */}
                <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="transparent"
                    fill="url(#ventasArea)"
                    dot={false}
                />

                {/* Barras de cantidad de ventas */}
                <Bar
                    yAxisId="left"
                    dataKey="salesCount"
                    name="Cantidad de ventas"
                    fill="url(#ventasBar)"
                    radius={[8, 8, 0, 0]}
                    barSize={18}
                    animationDuration={600}
                />

                {/* Línea del importe total */}
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalAmount"
                    name="Importe total"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={false}
                    animationDuration={600}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
