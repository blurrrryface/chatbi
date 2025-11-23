import { DashboardWidget } from "@/lib/types";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DynamicChart } from "@/components/dashboard/dynamic-chart";
import { DataTable } from "@/components/dashboard/data-table";

export function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  switch (widget.type) {
    case "kpi":
      return (
        <div className="col-span-1">
          <KpiCard
            title={widget.title}
            value={widget.data.value}
            trend={widget.data.trend}
            trendLabel={widget.data.trendLabel}
          />
        </div>
      );
    case "chart":
      return (
        <div className="col-span-1 md:col-span-2">
          <DynamicChart
            title={widget.title}
            description={widget.config?.description}
            type={widget.config?.chartType || "bar"}
            xKey={widget.config?.xKey}
            yKey={widget.config?.yKey}
            data={widget.data}
            color={widget.config?.color}
          />
        </div>
      );
    case "table":
      return (
        <div className="col-span-1 md:col-span-2">
          <DataTable title={widget.title} data={widget.data} />
        </div>
      );
    default:
      return null;
  }
}
