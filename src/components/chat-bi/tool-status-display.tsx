"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AgentState } from "@/lib/types";

interface ToolStatusDisplayProps {
  state: AgentState;
  status: "in_progress" | "stopped" | "disconnected";
}

type ActiveTool = NonNullable<AgentState['active_tool']>;

export function ToolStatusDisplay({ state, status }: ToolStatusDisplayProps) {
  // Store a map of tools by ID to handle multiple sequential calls in one turn
  const [tools, setTools] = useState<Map<string, ActiveTool>>(new Map());
  const [isThinking, setIsThinking] = useState(false);

  const activeTool = state.active_tool;
  const isAgentRunning = status === "in_progress";

  // Effect to manage the tools list
  useEffect(() => {
    // If the agent stops running, we don't necessarily clear the tools immediately
    // But if it starts running again and we have no active tool, it might be a new turn.
    if (isAgentRunning && !activeTool) {
      setIsThinking(true);
      // Optional: Clear tools on new turn start?
      // For now, let's clear them so we only show the current turn's tools.
      // We can refine this if we want persistent history across turns.
      setTools(new Map()); 
    } else if (activeTool) {
      setIsThinking(false);
      setTools((prev) => {
        const newMap = new Map(prev);
        // Use ID if available, otherwise fallback to name (less reliable for duplicates)
        const key = activeTool.id || activeTool.name;
        newMap.set(key, activeTool);
        return newMap;
      });
    } else {
       setIsThinking(false);
    }
  }, [activeTool, isAgentRunning]);

  // Render "Thinking..." only if agent is running and we have NO tools yet for this turn
  if (isThinking && tools.size === 0) {
    return (
      <div className="w-full mb-2 p-2 border rounded-lg bg-muted/20 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Thinking...</span>
      </div>
    );
  }

  if (tools.size === 0) return null;

  return (
    <div className="w-full mb-2 flex flex-col gap-2">
      {Array.from(tools.values()).map((tool, index) => (
        <ToolItem key={tool.id || index} tool={tool} />
      ))}
      {isThinking && (
         <div className="w-full p-2 border rounded-lg bg-muted/20 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
           <Loader2 className="h-4 w-4 animate-spin" />
           <span>Thinking...</span>
         </div>
      )}
    </div>
  );
}

function ToolItem({ tool }: { tool: ActiveTool }) {
  const [isOpen, setIsOpen] = useState(false);
  const isRunning = tool.status === "running";

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2 border rounded-lg bg-card p-2"
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Check className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {isRunning ? "Executing" : "Executed"}: <span className="font-mono text-xs bg-muted px-1 rounded">{tool.name}</span>
          </span>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 px-2">
        <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground overflow-x-auto max-h-[200px]">
          <div className="font-semibold mb-1 text-foreground/80">Arguments:</div>
          <pre>{JSON.stringify(tool.args, null, 2)}</pre>
          
          {tool.result && (
             <>
              <div className="font-semibold mt-2 mb-1 text-foreground/80">Result:</div>
              <pre>{typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}</pre>
             </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
