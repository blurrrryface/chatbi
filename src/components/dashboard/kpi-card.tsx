"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/util";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number; // 例如 12.5 代表 +12.5%
  trendLabel?: string; // 例如 "较上月"
  icon?: React.ReactNode;
}

export function KpiCard({ title, value, trend, trendLabel, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon || <DollarSign className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <span
              className={cn(
                "flex items-center font-medium",
                trend > 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {trend > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
              {Math.abs(trend)}%
            </span>
            <span className="ml-1 text-muted-foreground opacity-70">
              {trendLabel || "与上期相比"}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
