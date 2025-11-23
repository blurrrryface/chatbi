"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export type ChartType = "bar" | "line" | "area";

interface DynamicChartProps {
  title: string;
  description?: string;
  data: any[];
  type: ChartType;
  xKey: string; // X轴对应的字段名，如 "month"
  yKey: string; // Y轴对应的字段名，如 "sales"
  color?: string;
}

export function DynamicChart({
  title,
  description,
  data,
  type,
  xKey,
  yKey,
  color = "#8884d8", // 默认紫色
}: DynamicChartProps) {
  
  const renderChart = () => {
    const CommonProps = {
      data: data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...CommonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis dataKey={xKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...CommonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis dataKey={xKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.2} />
          </AreaChart>
        );
      case "bar":
      default:
        return (
          <BarChart {...CommonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis dataKey={xKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
