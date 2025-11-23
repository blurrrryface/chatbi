import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // 假设你有 shadcn 或者自己写简单的 div
import { ChartData } from '../lib/types';

// 简单的 Card 封装 (如果你没装 shadcn，可以用这个)
const SimpleCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
);

export const ChartCard = ({ chart }: { chart: ChartData }) => {
  return (
    <SimpleCard className="p-4 h-[350px] flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{chart.title}</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'line' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={chart.xAxis} stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Line type="monotone" dataKey={chart.yAxis} stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={chart.xAxis} stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey={chart.yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </SimpleCard>
  );
};
