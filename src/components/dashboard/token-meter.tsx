"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}

export function TokenMeter() {
  const [usage, setUsage] = useState<{ used: number; budget: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      const data = await res.json();
      if (data && typeof data.used === "number" && typeof data.budget === "number") {
        setUsage(data);
      }
    } catch (error) {
      console.error("Usage fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUsage]);

  if (loading && !usage) return <Loader2 className="size-3.5 animate-spin text-muted-foreground" />;
  if (!usage) return null;

  const percent = Math.min(100, (usage.used / usage.budget) * 100);
  const isHigh = percent > 80;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col items-end gap-1">
        <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60">
          TOKENS
        </span>
        <div className="flex items-center gap-2">
          <div className="h-[2px] w-20 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${isHigh ? "bg-amber-400" : "bg-primary"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatTokens(usage.used)} / {formatTokens(usage.budget)}
          </span>
        </div>
      </div>
    </div>
  );
}
