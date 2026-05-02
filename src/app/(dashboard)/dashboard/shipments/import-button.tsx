"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImportCSVButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Imported ${result.ok} shipments successfully.`);
        if (result.errors.length > 0) {
          toast.warning(`Skipped ${result.errors.length} rows due to errors.`);
        }
        router.refresh();
      } else {
        toast.error(result.error || "Failed to import CSV");
      }
    } catch {
      toast.error("An error occurred during upload");
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" disabled={loading} className="relative">
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Upload className="mr-2 size-4" />
        )}
        Import CSV
        <input
          type="file"
          accept=".csv"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleUpload}
          disabled={loading}
        />
      </Button>
    </div>
  );
}
