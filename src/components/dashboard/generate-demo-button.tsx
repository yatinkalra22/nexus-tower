"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { generateDemoData } from "@/server/demo-data";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GenerateDemoButton({ variant = "default" }: { variant?: "default" | "outline" | "ghost" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateDemoData();
      toast.success(`Generated ${result.count} demo shipments with live vessel tracking.`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to generate demo data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 size-4" />
      )}
      Generate Demo Data
    </Button>
  );
}
