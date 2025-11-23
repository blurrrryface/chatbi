"use client";
import React, { useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard } from "lucide-react";
import { DashboardProps } from "@/lib/types";
import { useChatSessions } from "@/lib/hooks/use-chat-sessions";
import { Sidebar } from "./sidebar";
import { Canvas } from "./canvas";

export function ChatBILayout({ 
  threadId, 
  setThreadId,
  sessions,
  createSession,
  deleteSession,
  switchSession
}: DashboardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  
  // 使用自定义 Hook
  // const { sessions, createSession, switchSession, deleteSession } = useChatSessions(threadId, setThreadId);

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b flex items-center px-4 justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
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
        {isHistoryOpen && (
          <>
            <ResizablePanel defaultSize={15} minSize={10} maxSize={20} className="min-w-[200px]">
              <Sidebar 
                sessions={sessions} 
                currentId={threadId} 
                onCreate={createSession} 
                onSwitch={switchSession} 
                onDelete={deleteSession}
              />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* Center: Canvas (Contains useCoAgent) */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <Canvas />
        </ResizablePanel>
        <ResizableHandle />

        {/* Right: Chat */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-background border-l">
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
