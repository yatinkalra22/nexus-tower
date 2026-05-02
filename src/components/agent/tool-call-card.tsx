"use client";

import { CheckCircle2, Loader2, PlayCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, any>;
  result?: any;
  status: "pending" | "running" | "done" | "error";
}

export function ToolCallCard({ toolName, args, result, status }: ToolCallCardProps) {
  const getIcon = () => {
    switch (status) {
      case "pending": return <PlayCircle className="size-4 text-muted-foreground" />;
      case "running": return <Loader2 className="size-4 animate-spin text-blue-500" />;
      case "done": return <CheckCircle2 className="size-4 text-green-500" />;
      case "error": return <AlertCircle className="size-4 text-red-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/50 text-xs font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-bold text-foreground capitalize">{toolName.replace(/([A-Z])/g, ' $1')}</span>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">{status}</Badge>
      </div>
      
      <div className="flex flex-col gap-1 overflow-hidden">
        <div className="text-muted-foreground">Arguments:</div>
        <pre className="p-2 rounded bg-background/50 overflow-x-auto">
          {JSON.stringify(args, null, 2)}
        </pre>
      </div>

      {result && (
        <div className="flex flex-col gap-1 overflow-hidden mt-1 pt-2 border-t border-muted">
          <div className="text-muted-foreground">Result:</div>
          <pre className="p-2 rounded bg-background/50 overflow-x-auto text-green-500/80">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
