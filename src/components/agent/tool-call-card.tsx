"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PlayCircle, AlertCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "done" | "error";
}

const statusDot: Record<ToolCallCardProps["status"], string> = {
  pending: "bg-muted-foreground/50",
  running: "bg-primary animate-pulse",
  done: "bg-emerald-400",
  error: "bg-red-400",
};

export function ToolCallCard({ toolName, args, result, status }: ToolCallCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-l-2 border-primary/30 pl-4 py-1">
      {/* Header row - clickable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left group transition-colors duration-150 hover:bg-white/[0.03] rounded-md px-1.5 py-1 -ml-1.5"
      >
        <ChevronRight
          className={`size-3 text-muted-foreground/60 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        />
        <span className={`size-1.5 rounded-full shrink-0 ${statusDot[status]}`} />
        <span className="font-mono text-xs text-foreground/80 capitalize">
          {toolName.replace(/([A-Z])/g, " $1").trim()}
        </span>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] uppercase tracking-wider border-border/50 text-muted-foreground/60 font-mono"
        >
          {status}
        </Badge>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="mt-2 ml-5 flex flex-col gap-2 animate-fade-in">
          {/* Arguments */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono">
              args
            </span>
            <pre className="text-[11px] font-mono leading-relaxed text-foreground/60 bg-white/[0.02] rounded-md px-3 py-2 overflow-x-auto border border-border/30">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {result != null && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono">
                result
              </span>
              <pre className="text-[11px] font-mono leading-relaxed text-emerald-400/80 bg-white/[0.02] rounded-md px-3 py-2 overflow-x-auto border border-border/30">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
