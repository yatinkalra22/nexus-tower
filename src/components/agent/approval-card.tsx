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
      <div className="p-4 border rounded-lg bg-green-500/10 border-green-500/20 text-green-500 text-sm flex items-center gap-2">
        <Check className="size-4" />
        Action Executed
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card shadow-sm border-orange-500/30">
      <div className="text-sm font-semibold text-orange-500 uppercase tracking-wider flex items-center gap-2">
        <Loader2 className="size-3 animate-spin" />
        Awaiting Human Approval
      </div>
      <p className="text-sm text-foreground">
        Agent proposes <strong>{action}</strong> for shipment {payload.shipmentId}.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleExecute} disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="size-3 animate-spin mr-2" /> : <Check className="size-3 mr-2" />}
          Approve & Execute
        </Button>
        <Button size="sm" variant="outline" onClick={() => toast.info("Action rejected")} disabled={loading}>
          <X className="size-3 mr-2" />
          Reject
        </Button>
      </div>
    </div>
  );
}
