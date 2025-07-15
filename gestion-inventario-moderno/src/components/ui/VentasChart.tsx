// src/components/ui/VentasChart.tsx
'use client';

import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

export interface VentasData {
    date: string;
    salesCount: number;
    totalAmount: number;
}

export default function VentasChart({ data }: { data: VentasData[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value: any, name: string) => (
                    name === 'totalAmount' ? [`$${Number(value).toFixed(2)}`, 'Importe'] : [value, 'Ventas']
                )} />
                <Legend />
                <Bar
                    yAxisId="left"
                    dataKey="salesCount"
                    name="Cantidad de ventas"
                    barSize={20}
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalAmount"
                    name="Importe total"
                    stroke="#10b981"
                    dot={false}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
