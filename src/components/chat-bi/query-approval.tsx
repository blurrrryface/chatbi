import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, Edit2, Loader2, ChevronDown, ChevronRight, X } from "lucide-react";
import { useCoAgent } from "@copilotkit/react-core";
import { AgentState } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface QueryApprovalProps {
  args: {
    indicators?: string[];
    candidate_indicators?: string[];
    start_time?: string;
    end_time?: string;
    time_list?: string[]; // Keep for backward compatibility or fallback
    row_privilege?: string;
  };
  status: "executing" | "pending" | "complete";
  respond?: (response: any) => void;
}

export function QueryApproval({ args, status, respond }: QueryApprovalProps) {
  const [indicators, setIndicators] = useState<string[]>([]);
  const [candidateIndicators, setCandidateIndicators] = useState<string[]>([]);
  
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  
  const [privilege, setPrivilege] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { setState } = useCoAgent<AgentState>({
      name: "sample_agent" // Must match the agent name in the backend
  });
  
  // Sync state with args
  useEffect(() => {
    if (status === "executing" || status === "pending") {
        // Ensure indicators is an array
        let newIndicators: string[] = [];
        if (Array.isArray(args.indicators)) {
          newIndicators = args.indicators;
        } else if (typeof args.indicators === 'string') {
          // Handle case where LLM returns a single string instead of array
          newIndicators = (args.indicators as string).split(',').map(s => s.trim()).filter(Boolean);
        }
        setIndicators(newIndicators);
        
        if (Array.isArray(args.candidate_indicators)) {
            setCandidateIndicators(args.candidate_indicators);
        } else if (typeof args.candidate_indicators === 'string') {
            // Handle potential comma-separated string from LLM
            const candidates = (args.candidate_indicators as string).split(',').map(s => s.trim()).filter(Boolean);
            setCandidateIndicators(candidates);
        }

        // Ensure time
        if (args.start_time) setStartTime(args.start_time);
        if (args.end_time) setEndTime(args.end_time);
        
        // Fallback to time_list if start/end not explicitly provided but time_list is
        if ((!args.start_time || !args.end_time) && Array.isArray(args.time_list)) {
            if (args.time_list.length > 0) setStartTime(args.time_list[0]);
            if (args.time_list.length > 1) setEndTime(args.time_list[1]);
        }

        setPrivilege(args.row_privilege || "");
    }
  }, [args, status]);

  if (status === "complete") {
    return (
      <div className="w-full max-w-md my-2 border rounded-lg overflow-hidden bg-background">
        <div 
            className="p-3 flex items-center justify-between bg-green-50 dark:bg-green-900/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
        >
             <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                <Check className="w-4 h-4" />
                查询参数已批准
             </div>
             {isExpanded ? <ChevronDown className="w-4 h-4 text-green-800 dark:text-green-300" /> : <ChevronRight className="w-4 h-4 text-green-800 dark:text-green-300" />}
        </div>
        
        {isExpanded && (
             <div className="p-3 text-xs text-muted-foreground border-t bg-card">
                <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="font-semibold">指标:</span>
                    <span>{indicators.join(", ")}</span>
                    
                    <span className="font-semibold">时间:</span>
                    <span>{startTime} - {endTime}</span>
                    
                    <span className="font-semibold">权限:</span>
                    <span>{privilege}</span>
                </div>
            </div>
        )}
      </div>
    );
  }

  const handleConfirm = () => {
    const finalTimeList = [startTime, endTime].filter(Boolean);

    // 1. Update global Agent State
    setState({
        indicator_list: indicators,
        time_list: finalTimeList,
        priviledge: privilege
    });

    // 2. Respond to the tool call to resume the agent
    if (respond) {
        respond(JSON.stringify({
          indicators,
          time_list: finalTimeList,
          start_time: startTime,
          end_time: endTime,
          row_privilege: privilege
        }));
    }
  };

  return (
    <Card className="w-full max-w-md my-2 shadow-sm">
      <CardHeader className="p-3 pb-2 bg-muted/30">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-primary" />
            确认查询参数
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">指标</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {indicators.map((ind, idx) => (
              <Badge key={idx} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-0.5 h-6 font-normal">
                {ind}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive"
                    onClick={() => {
                        const newInds = indicators.filter((_, i) => i !== idx);
                        setIndicators(newInds);
                    }}
                >
                    <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
            {indicators.length === 0 && <span className="text-muted-foreground text-xs italic py-1">未选择指标</span>}
          </div>
          
          <div className="flex gap-2">
             <select 
                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                    if (e.target.value && !indicators.includes(e.target.value)) {
                        setIndicators([...indicators, e.target.value]);
                        e.target.value = ""; // Reset selection
                    }
                }}
                defaultValue=""
             >
                <option value="" disabled>+ 从搜索结果添加指标</option>
                {candidateIndicators.length > 0 ? (
                    candidateIndicators.map((cand, idx) => (
                        <option key={idx} value={cand} disabled={indicators.includes(cand)}>
                            {cand}
                        </option>
                    ))
                ) : (
                    <option value="" disabled>未找到候选项</option>
                )}
             </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">时间范围</label>
           <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="text-[10px] text-muted-foreground block mb-1">开始日期</label>
                <input 
                   type="date" 
                   className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                   value={startTime}
                   onChange={(e) => setStartTime(e.target.value)}
                />
             </div>
             <div>
                <label className="text-[10px] text-muted-foreground block mb-1">结束日期</label>
                <input 
                   type="date" 
                   className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                   value={endTime}
                   onChange={(e) => setEndTime(e.target.value)}
                />
             </div>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">行权限</label>
          <div className="bg-secondary px-2 py-0.5 rounded-md text-sm border">
                <input 
                  className="bg-transparent border-none outline-none w-full text-xs"
                  value={privilege}
                  onChange={(e) => setPrivilege(e.target.value)}
                  placeholder="无权限限制"
                />
          </div>
        </div>

      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-end border-t bg-muted/10 mt-2">
        <Button 
            onClick={handleConfirm} 
            size="sm" 
            className="h-8 text-xs px-3"
            disabled={status !== "executing" && status !== "pending"}
        >
          {status === "executing" || status === "pending" ? "批准并继续" : <Loader2 className="w-3 h-3 animate-spin" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
