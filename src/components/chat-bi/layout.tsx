"use client";
import React, { useState, useRef, useEffect } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCoAgentStateRender, useRenderToolCall, useCopilotAction, useHumanInTheLoop } from "@copilotkit/react-core";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, Loader2, X, ChevronDown, ChevronRight } from "lucide-react";
import { DashboardProps, AgentState } from "@/lib/types";
import { useChatSessions } from "@/lib/hooks/use-chat-sessions";
import { Sidebar } from "./sidebar";
import { Canvas } from "./canvas";
import { ToolStatusDisplay } from "./tool-status-display";
import { QueryApproval } from "./query-approval";
import { ImperativePanelHandle } from "react-resizable-panels";
import { cn } from "@/lib/util";

function AutoCollapse({ onCollapse }: { onCollapse: () => void }) {
  const onCollapseRef = useRef(onCollapse);
  onCollapseRef.current = onCollapse;

  useEffect(() => {
    onCollapseRef.current();
  }, []);
  return null;
}

function KnowledgeBaseResult({ answer, sources }: { answer: any, sources: any[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const answerChunks: string[] = Array.isArray(answer) 
    ? answer.map((a: any) => typeof a === 'string' ? a : JSON.stringify(a))
    : [typeof answer === 'string' ? answer : JSON.stringify(answer)];

  if (answerChunks.length <= 1) {
    return (
      <div className="p-4 border rounded bg-muted/20">
        <div 
          className="flex items-center justify-between text-sm font-semibold text-primary mb-2 cursor-pointer hover:opacity-80"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            知识库结果
          </div>
        </div>
        
        {isExpanded && (
          <div className="max-h-60 overflow-y-auto prose prose-sm max-w-none dark:prose-invert animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm whitespace-pre-wrap">{answerChunks[0]}</p>
            {sources.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs font-semibold mb-1">来源:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground">
                  {sources.map((source: any, idx: number) => (
                    <li key={idx}>
                      {typeof source === 'string' ? source : JSON.stringify(source)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-muted/20">
      <div 
        className="flex items-center justify-between text-sm font-semibold text-primary mb-2 cursor-pointer hover:opacity-80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          知识库结果 <span className="text-xs font-normal text-muted-foreground">({answerChunks.length} 项)</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 mb-2">
            {answerChunks.map((chunk, idx) => (
              <div 
                key={idx} 
                className="border p-2 rounded cursor-pointer hover:bg-background bg-background/50 transition-colors h-24 overflow-hidden relative group"
                onClick={() => setSelectedIndex(idx)}
              >
                 <div className="text-xs line-clamp-4 whitespace-pre-wrap text-muted-foreground group-hover:text-foreground">
                   {chunk}
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/10 group-hover:to-transparent pointer-events-none" />
              </div>
            ))}
          </div>

          {sources.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs font-semibold mb-1">来源:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground">
                  {sources.map((source: any, idx: number) => (
                    <li key={idx}>
                      {typeof source === 'string' ? source : JSON.stringify(source)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedIndex(null)}>
          <div 
            className="bg-background border p-0 rounded-lg w-[90vw] max-w-2xl h-[80vh] shadow-lg flex flex-col relative animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
             <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">结果详情 {selectedIndex + 1}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIndex(null)}>
                  <X className="h-4 w-4" />
                </Button>
             </div>
             <div className="flex-1 overflow-hidden p-4">
               <div className="h-full overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                 <p className="text-sm whitespace-pre-wrap">{answerChunks[selectedIndex]}</p>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatBILayout({ 
  threadId, 
  setThreadId,
  sessions,
  createSession,
  deleteSession,
  switchSession
}: DashboardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isLayoutChanging, setIsLayoutChanging] = useState(false);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const chatRef = useRef<ImperativePanelHandle>(null);
  
  useHumanInTheLoop({
    name: "approve_query_parameters",
    description: "Request user approval for the query parameters before generating SQL.",
    parameters: [
      {
        name: "indicators",
        type: "array",
        items: { type: "string" },
        description: "List of indicators identified from the user query.",
      },
      {
        name: "candidate_indicators",
        type: "array",
        items: { type: "string" },
        description: "List of all available candidate indicators found from the search tool.",
      },
      {
        name: "start_time",
        type: "string",
        description: "The start time of the query range (YYYY-MM-DD).",
      },
      {
        name: "end_time",
        type: "string",
        description: "The end time of the query range (YYYY-MM-DD).",
      },
      {
        name: "time_list",
        type: "array",
        items: { type: "string" },
        description: "List of time ranges (deprecated, use start_time and end_time).",
      },
      {
        name: "row_privilege",
        type: "string",
        description: "The row privilege string to be applied.",
      },
    ],
    render: (props) => {
      return <QueryApproval {...props} />;
    },
  });

  const performLayoutChange = (action: () => void) => {
    setIsLayoutChanging(true);
    action();
    setTimeout(() => setIsLayoutChanging(false), 300);
  };

  useCoAgentStateRender<AgentState>({
    name: "sample_agent",
    render: ({ state, status }) => {
      if (status === "inProgress" && isHistoryOpen) {
        return (
          <>
            <AutoCollapse onCollapse={() => performLayoutChange(() => {
              sidebarRef.current?.collapse();
              chatRef.current?.resize(40);
            })} />
            <ToolStatusDisplay state={state} status={status as any} />
          </>
        );
      }
      return <ToolStatusDisplay state={state} status={status as any} />;
    },
  });

  useRenderToolCall({
    name: "kb_chat",
    description: "Knowledge Base Chat",
    parameters: [
      {
        name: "question",
        type: "string",
        description: "The question to ask the knowledge base",
        required: true,
      },
      {
        name: "file_name",
        type: "string",
        description: "Specific file to search in",
        required: false,
      }
    ],
    render: ({ args, status, result }) => {

      if (status === "inProgress") {
        return (
          <div className="p-4 border rounded animate-pulse bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching Knowledge Base...</span>
            </div>
            <p className="font-medium text-sm">{args.question}</p>
          </div>
        );
      }

      if (status === "complete" && result) {
        const sources = (typeof result === 'object' && result !== null && 'sources' in result && Array.isArray(result.sources)) 
          ? result.sources 
          : [];
        
        let answer: any;
        if (typeof result === 'string') {
          answer = result;
        } else if (typeof result === 'object' && result !== null) {
           answer = result.answer || result;
        } else {
           answer = String(result);
        }

        return <KnowledgeBaseResult answer={answer} sources={sources} />;
      }

      return null;
    },
  });
  
  // 使用自定义 Hook
  // const { sessions, createSession, switchSession, deleteSession } = useChatSessions(threadId, setThreadId);

  const toggleSidebar = () => {
    const sidebar = sidebarRef.current;
    const chat = chatRef.current;
    if (sidebar && chat) {
      performLayoutChange(() => {
        if (isHistoryOpen) {
          sidebar.collapse();
          chat.resize(40);
        } else {
          sidebar.expand();
          chat.resize(25);
        }
      });
    }
  };

  const transitionClass = isLayoutChanging ? "transition-all duration-300 ease-in-out" : "";

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b flex items-center px-4 justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {isHistoryOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2 font-semibold ml-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span>AI ChatBI</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground font-mono">Thread: {threadId}</div>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: History */}
        <ResizablePanel 
          ref={sidebarRef}
          defaultSize={15} 
          minSize={10} 
          maxSize={20} 
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setIsHistoryOpen(false)}
          onExpand={() => setIsHistoryOpen(true)}
          className={cn(transitionClass, isHistoryOpen ? "min-w-[200px]" : "min-w-0")}
        >
          <Sidebar 
            sessions={sessions} 
            currentId={threadId} 
            onCreate={createSession} 
            onSwitch={switchSession} 
            onDelete={deleteSession}
          />
        </ResizablePanel>
        <ResizableHandle />

        {/* Center: Canvas (Contains useCoAgent) */}
        <ResizablePanel 
          defaultSize={60} 
          minSize={30} 
          className={cn(transitionClass)}
        >
          <Canvas />
        </ResizablePanel>
        <ResizableHandle />

        {/* Right: Chat */}
        <ResizablePanel 
          ref={chatRef}
          defaultSize={25} 
          minSize={20} 
          maxSize={60} 
          className={cn("bg-background border-l", transitionClass)}
        >
          <CopilotChat
            key={threadId} 
            instructions="You are a BI assistant. Update the shared state 'widgets' to visualize data."
            labels={{
              title: "Data Copilot",
              initial: "Hello! I'm ready to help you analyze data.",
            }}
            className="h-full"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
