// src/components/AgentPerformanceChart.tsx
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PerformanceData {
    name: string; // ex: "Jan", "Fev"
    total: number; // ex: 3 (nombre de ventes)
}

interface AgentPerformanceChartProps {
    data: PerformanceData[];
}

export function AgentPerformanceChart({ data }: AgentPerformanceChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance des Ventes</CardTitle>
                <CardDescription>Volume de biens vendus sur les 6 derniers mois.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ background: 'white', border: '1px solid #ccc', borderRadius: '5px' }}
                            labelStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => [`${value} ${value > 1 ? 'ventes' : 'vente'}`, 'Total']}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
