"use client";
import { useCoAgent } from "@copilotkit/react-core";
import { AgentState } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard } from "lucide-react";
import { WidgetRenderer } from "@/components/chat-bi/widget-renderer";

export function Canvas() {
  // 🔥 连接 LangGraph
  const { state, setState } = useCoAgent<AgentState>({
    name: "sample_agent",
    initialState: { widgets: [] },
  });

  const widgets = state.widgets || [];

  return (
    <ScrollArea className="h-full bg-background/50 p-4">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {widgets.length === 0 ? "Ready for analysis." : `Showing ${widgets.length} widgets`}
            </p>
          </div>
          {widgets.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setState({ ...state, widgets: [] })}>
              Clear Canvas
            </Button>
          )}
        </div>
        <Separator />

        {/* Content */}
        {widgets.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
            <LayoutDashboard className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Empty Canvas</p>
            <p className="text-sm mt-2">Start a new conversation on the right.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {widgets.map((widget, index) => (
              <WidgetRenderer key={widget.id || index} widget={widget} />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
