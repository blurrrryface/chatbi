"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { ChatBILayout } from "@/components/chat-bi/layout";
import { useChatSessions } from "@/lib/hooks/use-chat-sessions"; // 引入 hook

export default function Page() {
  const [threadId, setThreadId] = useState<string>(() => uuidv4());
  const { sessions, createSession, deleteSession, switchSession } = useChatSessions(threadId, setThreadId);

  return (
    // 这里的 key={threadId} 依然保留，确保 CopilotKit 内部上下文彻底重置
    <CopilotKit 
      runtimeUrl="/api/copilotkit" 
      agent="sample_agent" 
      threadId={threadId}
      key={threadId} 
    >
      <ChatBILayout 
        threadId={threadId} 
        setThreadId={setThreadId}
        // 🔥 把状态和方法传下去
        sessions={sessions}
        createSession={createSession}
        deleteSession={deleteSession}
        switchSession={switchSession}
      />
    </CopilotKit>
  );
}
