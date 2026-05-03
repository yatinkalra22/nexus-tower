"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { seedScenario } from "@/server/seed-scenario";

export function SeedDemoButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);

  const handleClick = () => {
    setRunning(true);
    startTransition(async () => {
      try {
        await seedScenario();
        toast.success("Demo data loaded");
        router.refresh();
      } catch {
        toast.error("Failed to load demo data");
      } finally {
        setRunning(false);
      }
    });
  };

  const loading = isPending || running;

  return (
    <Button size="sm" variant="outline" className="border-border/50" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
      Load Demo Data
    </Button>
  );
}
