'use client';

import React from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    Legend,
    TooltipProps,
} from 'recharts';
import { format } from 'date-fns';

export interface ProfitRecord {
    date: string;
    revenue: number;
    costOfGoods: number;
    profit: number;
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
                {payload.map((pld: { dataKey: React.Key | null | undefined; color: any; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; value: any; }) => (
                    <div
                        key={pld.dataKey}
                        className="flex items-center"
                        style={{ color: pld.color }}
                    >
            <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: pld.color }}
            />
                        <span>
              {pld.name}: ${Number(pld.value).toFixed(2)}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function RentabilidadChart({
                                              data,
                                          }: {
    data: ProfitRecord[];
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 20, right: 30, bottom: 10, left: 0 }}
            >
                {/* Gradiente para área de ganancia */}
                <defs>
                    <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.25}
                        />
                        <stop
                            offset="80%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                />

                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d: string | number | Date) => format(new Date(d), 'dd/MM')}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={(v: any) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />

                <ReTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />

                {/* Área bajo la ganancia */}
                <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="none"
                    fill="url(#profitArea)"
                    animationDuration={700}
                />

                {/* Líneas principales */}
                <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos"
                    stroke="#4f46e5" /* indigo‑600 */
                    strokeWidth={3}
                    dot={false}
                    animationDuration={700}
                />
                <Line
                    type="monotone"
                    dataKey="costOfGoods"
                    name="Costo de ventas"
                    stroke="#a1a1aa" /* zinc‑400 */
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={false}
                    animationDuration={700}
                />
                <Line
                    type="monotone"
                    dataKey="profit"
                    name="Ganancia"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    animationDuration={700}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
