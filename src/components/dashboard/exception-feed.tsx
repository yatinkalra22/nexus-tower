"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Exception {
  id: string;
  shipmentId: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  createdAt: string;
}

const severityBorder: Record<string, string> = {
  critical: "border-l-red-400",
  high: "border-l-amber-400",
  medium: "border-l-yellow-400",
  low: "border-l-sky-400",
};

const severityDot: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  medium: "bg-yellow-400",
  low: "bg-sky-400",
};

export function ExceptionFeed() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/sse/exceptions");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setExceptions(data);
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
          Exception Feed
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {exceptions.length} active
        </span>
      </div>

      <ScrollArea className="flex-1 h-[400px]">
        <div className="flex flex-col gap-1.5">
          {exceptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/60 text-sm">
              No active exceptions
            </div>
          ) : (
            exceptions.map((ex, i) => (
              <Link
                key={ex.id}
                href={`/dashboard/shipments/${ex.shipmentId}`}
                className={cn(
                  "group flex flex-col gap-1.5 border-l-2 rounded-r-lg py-2.5 px-3 transition-all duration-150 hover:bg-white/[0.03]",
                  severityBorder[ex.severity] || "border-l-sky-400",
                  "animate-slide-in"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("size-1.5 rounded-full", severityDot[ex.severity])} />
                    <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                      {ex.severity}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/60 flex items-center gap-1">
                    <Clock className="size-2.5" />
                    {formatDistanceToNow(new Date(ex.createdAt))}
                  </span>
                </div>
                <p className="text-sm leading-tight group-hover:text-foreground transition-colors">
                  {ex.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
                  <MapPin className="size-2.5" />
                  {ex.shipmentId}
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
