"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Exception {
  id: string;
  shipmentId: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  createdAt: string;
}

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="size-4 text-orange-500" />
          Live Exception Feed
        </h3>
        <Badge variant="outline">{exceptions.length} Active</Badge>
      </div>

      <ScrollArea className="flex-1 h-[400px] pr-4">
        <div className="flex flex-col gap-3">
          {exceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
              No active exceptions.
            </div>
          ) : (
            exceptions.map((ex) => (
              <Link 
                key={ex.id} 
                href={`/dashboard/shipments/${ex.shipmentId}`}
                className="group flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={getSeverityColor(ex.severity)}>
                    {ex.severity}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDistanceToNow(new Date(ex.createdAt))} ago
                  </span>
                </div>
                <p className="text-sm font-medium leading-tight group-hover:underline">
                  {ex.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  <span>Shipment: {ex.shipmentId}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
