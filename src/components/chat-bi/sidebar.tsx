import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, History, MessageSquare, Trash2 } from "lucide-react";
import { ChatSession } from "@/lib/types";

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string;
  onCreate: () => void;
  onSwitch: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function Sidebar({ sessions, currentId, onCreate, onSwitch, onDelete }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="p-3 border-b">
        <Button className="w-full justify-start gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
          <History className="h-3 w-3" />
          History
        </p>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div 
              key={session.id}
              className={`
                group flex items-center justify-between rounded-md px-2 py-2 text-sm cursor-pointer transition-colors
                ${currentId === session.id ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/50 text-muted-foreground"}
              `}
              onClick={() => onSwitch(session.id)}
            >
              <div className="flex items-center overflow-hidden">
                <MessageSquare className="h-3 w-3 mr-2 shrink-0 opacity-70" />
                <span className="truncate">{session.title}</span>
              </div>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                onClick={(e) => onDelete(e, session.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
