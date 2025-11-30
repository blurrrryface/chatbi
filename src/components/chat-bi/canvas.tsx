"use client";
import { useState } from "react";
import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { AgentState } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Eye, EyeOff } from "lucide-react";
import { WidgetRenderer } from "@/components/chat-bi/widget-renderer";

export function Canvas() {
  // 🔥 连接 LangGraph
  const { state, setState } = useCoAgent<AgentState>({
    name: "sample_agent",
    initialState: { widgets: [] },
  });

  const [isDevMode, setIsDevMode] = useState(false);
  const widgets = state.widgets || [];
  
  const visibleWidgets = widgets.filter(w => w.type !== 'sql' || isDevMode);

  useCopilotAction({
    name: "show_sql",
    description: "Display the generated SQL on the dashboard canvas.",
    parameters: [
      {
        name: "sql",
        type: "string",
        description: "The generated SQL query.",
        required: true,
      },
      {
        name: "title",
        type: "string",
        description: "A title for the SQL query widget.",
      }
    ],
    handler: async ({ sql, title }) => {
      setState(prevState => ({
        ...prevState,
        widgets: [
          ...(prevState.widgets || []),
          {
            id: Math.random().toString(36).substring(7),
            type: "sql",
            title: title || "生成的 SQL",
            data: { sql },
          }
        ]
      }));
      return "SQL 已显示在画布上。";
    },
  });

  return (
    <ScrollArea className="h-full bg-background/50 p-4">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
            <p className="text-sm text-muted-foreground">
              {visibleWidgets.length === 0 ? "准备分析。" : `显示 ${visibleWidgets.length} 个组件`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDevMode(!isDevMode)}
              className="gap-2"
            >
              {isDevMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {isDevMode ? "开发者模式已开启" : "开发者模式已关闭"}
            </Button>
            {widgets.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setState({ ...state, widgets: [] })}>
                清空画布
              </Button>
            )}
          </div>
        </div>
        <Separator />

        {/* Content */}
        {visibleWidgets.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
            <LayoutDashboard className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">空画布</p>
            <p className="text-sm mt-2">在右侧开始新的对话。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {visibleWidgets.map((widget, index) => (
              <WidgetRenderer 
                key={widget.id || index} 
                widget={widget} 
                isDevMode={isDevMode}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
