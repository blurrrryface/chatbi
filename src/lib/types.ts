export interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: any[];
  xAxis: string;
  yAxis: string;
}

// 定义会话类型
export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
}

// --- 2. 子组件：负责 UI 和 会话列表逻辑 ---
export interface DashboardProps {
  threadId: string;
  setThreadId: (id: string) => void;
  // 🔥 新增接收的 props
  sessions: ChatSession[];
  createSession: () => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
  switchSession: (id: string) => void;
}

export interface SidebarProps {
  threadId: string;
  // 🔥 确保接口包含这些
  sessions: ChatSession[];
  createSession: () => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
  switchSession: (id: string) => void;
}

// 这是一个“契约”，Python端的 LangGraph State 必须和这个保持一致
export type WidgetType = "kpi" | "chart" | "table";
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  data: any; 
  config?: any;
}
// 这是 Agent 的核心状态
export interface AgentState {
  widgets: DashboardWidget[];
  // 可以在这里加更多状态，比如 current_dataset, user_preferences 等
  active_dataset?: string; 
  tool_status?: string;
  active_tool?: {
    id?: string;
    name: string;
    args: any;
    status: "running" | "done";
    result?: any;
  };
}
