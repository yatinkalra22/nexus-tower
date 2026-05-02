"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApprovalCardProps {
  action: string;
  payload: Record<string, any>;
  onExecuted?: (outcome: string) => void;
}

export function ApprovalCard({ action, payload, onExecuted }: ApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const [executed, setExecuted] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const result = await res.json();
      if (result.ok) {
        toast.success("Action executed successfully");
        setExecuted(true);
        onExecuted?.(result.outcome);
      } else {
        toast.error(result.error || "Execution failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (executed) {
    return (
      <div className="border-l-2 border-emerald-400/60 pl-4 py-2">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
          <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
          Action executed
        </div>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-amber-400 pl-4 py-3">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-[11px] uppercase tracking-widest text-amber-400/80 font-mono">
            Awaiting approval
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          Agent proposes{" "}
          <span className="font-mono text-foreground">{action}</span>
          {payload.shipmentId && (
            <>
              {" "}for shipment{" "}
              <span className="font-mono text-foreground">{String(payload.shipmentId)}</span>
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={loading}
            className="h-7 px-3 text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors duration-150"
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin mr-1.5" />
            ) : (
              <Check className="size-3 mr-1.5" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Action rejected")}
            disabled={loading}
            className="h-7 px-3 text-xs font-mono border-border/50 text-muted-foreground hover:bg-white/[0.03] transition-colors duration-150"
          >
            <X className="size-3 mr-1.5" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
