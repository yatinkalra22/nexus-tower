"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { GenerateDemoButton } from "@/components/dashboard/generate-demo-button";

const STORAGE_KEY = "nexustower-onboarding-dismissed";

export function GetStartedBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
          Get Started
        </span>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-xs font-mono text-primary">
            1
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Import Shipments</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a CSV or create manually to start tracking
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <GenerateDemoButton variant="outline" />
            <Link
              href="/dashboard/shipments"
              className="rounded-lg border border-border/50 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Import CSV
            </Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-xs font-mono text-primary">
            2
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Track Live Vessels</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Attach real MMSI numbers to shipments for AIS tracking
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-xs font-mono text-primary">
            3
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Ask the Agent</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use AI to detect disruptions and propose reroutes
            </p>
          </div>
          <Link
            href="/dashboard/agent"
            className="shrink-0 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Open Agent
          </Link>
        </div>
      </div>
    </div>
  );
}
