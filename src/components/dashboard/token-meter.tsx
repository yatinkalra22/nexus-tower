"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2 } from "lucide-react";

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

  if (loading && !usage) return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  if (!usage) return null;

  const percent = Math.min(100, (usage.used / usage.budget) * 100);
  const isHigh = percent > 80;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Coins className="size-3" />
          Token Budget
        </div>
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border/50">
          <div 
            className={`h-full transition-all duration-500 ${isHigh ? 'bg-orange-500' : 'bg-primary'}`} 
            style={{ width: `${percent}%` }} 
          />
        </div>
      </div>
      <Badge variant={isHigh ? "destructive" : "outline"} className="font-mono text-[10px] h-6 px-2">
        {usage.used.toLocaleString()} / {usage.budget / 1000}k
      </Badge>
    </div>
  );
}
