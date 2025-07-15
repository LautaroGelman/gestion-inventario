// src/components/ui/RentabilidadChart.tsx
'use client';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
} from 'recharts';

export interface ProfitRecord {
    date: string;
    revenue: number;
    costOfGoods: number;
    profit: number;
}

export default function RentabilidadChart({ data }: { data: ProfitRecord[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                    domain={[0, 'dataMax']}
                    tickFormatter={v => `$${v.toFixed(2)}`}
                />
                <ReTooltip
                    formatter={(value: any, name: string) => [`$${Number(value).toFixed(2)}`, name]}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos"
                    stroke="#10b981"
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="costOfGoods"
                    name="Costo de ventas"
                    stroke="#f59e0b"
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="profit"
                    name="Ganancia"
                    stroke="#6366f1"
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
