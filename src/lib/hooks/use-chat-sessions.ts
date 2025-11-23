// lib/hooks/use-chat-sessions.ts

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from "@/lib/types";

export function useChatSessions(
  currentThreadId: string, 
  setThreadId: (id: string) => void
) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // 🔥 修复部分：更安全的初始化逻辑
  useEffect(() => {
    setSessions((prevSessions) => {
      // 1. 在回调内部检查，确保拿到的是最新的 prevSessions
      const exists = prevSessions.some(s => s.id === currentThreadId);
      
      // 2. 如果已存在，直接返回原数组（不触发重渲染）
      if (exists) {
        return prevSessions;
      }

      // 3. 如果不存在，添加新会话
      const newSession: ChatSession = {
        id: currentThreadId,
        title: `Analysis ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        createdAt: new Date(),
      };
      
      return [newSession, ...prevSessions];
    });
  }, [currentThreadId]); // 依赖项里去掉 sessions，防止死循环

  // ... 下面的代码保持不变 ...
  const createSession = () => {
    const newId = uuidv4();
    setThreadId(newId);
    // 注意：这里不需要手动 setSessions，因为 threadId 变了，上面的 useEffect 会自动执行
  };

  const switchSession = (id: string) => {
    if (id !== currentThreadId) {
      setThreadId(id);
    }
  };

  const deleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    
    // 这里也建议用回调形式，虽然之前的写法通常也没问题
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== idToDelete);
      
      // 处理删除当前选中项的逻辑
      if (idToDelete === currentThreadId) {
        if (newSessions.length > 0) {
          // 必须在渲染周期外调用 setThreadId，或者确保它不会冲突
          // 这里直接调用是安全的，因为它是事件处理函数
          setThreadId(newSessions[0].id);
        } else {
          const newId = uuidv4();
          setThreadId(newId);
        }
      }
      return newSessions;
    });
  };

  return {
    sessions,
    createSession,
    switchSession,
    deleteSession
  };
}
