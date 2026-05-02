"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Globe, Loader2, RefreshCw } from "lucide-react";
import { getTariffRate } from "@/server/tariffs/wits";

export function TariffSimulator() {
  const [hsCode, setHsCode] = useState("851712"); // Mobile phones
  const [origin, setOrigin] = useState("CN");
  const [destination, setDestination] = useState("US");
  const [goodsValue, setGoodsValue] = useState(500000);

  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [overrideRate, setOverrideRate] = useState<number | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setOverrideRate(null);
    try {
      const fetchedRate = await getTariffRate(hsCode, origin, destination);
      setRate(fetchedRate);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const activeRate = overrideRate !== null ? overrideRate : rate;
  const dutyAmount = activeRate !== null ? goodsValue * (activeRate / 100) : 0;
  const landedCost = goodsValue + dutyAmount;

  return (
    <Card className="w-full border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Landed Cost & Tariff Simulator</h3>
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground/60">
          Real World Bank WITS data + what-if scenarios
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {/* ── Inputs ── */}
        <div className="flex flex-col gap-4 md:border-r md:border-border/50 md:pr-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                HS-6 Code
              </Label>
              <Input
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                placeholder="e.g. 851712"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                Goods Value ($)
              </Label>
              <Input
                type="number"
                value={goodsValue}
                onChange={(e) => setGoodsValue(Number(e.target.value))}
                min={0}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                Origin (ISO-2)
              </Label>
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="CN"
                maxLength={2}
                className="font-mono uppercase text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                Destination (ISO-2)
              </Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="US"
                maxLength={2}
                className="font-mono uppercase text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={loading || !hsCode || !origin || !destination}
            className="mt-2"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Globe className="mr-2 size-4" />
            )}
            Fetch WITS Rate
          </Button>

          {rate !== null && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/50 bg-secondary/50 p-4">
              <Label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary">
                <RefreshCw className="size-3" />
                What-if Scenario
              </Label>
              <p className="text-xs text-muted-foreground">
                Override the fetched {rate}% rate to simulate geopolitical shifts:
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={activeRate ?? rate}
                  onChange={(e) => setOverrideRate(Number(e.target.value))}
                  className="flex-1 accent-[#38BDF8]"
                />
                <span className="w-14 text-right font-mono text-sm font-semibold text-primary">
                  {activeRate?.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div className="flex flex-col justify-center gap-5 rounded-lg border border-border/50 bg-secondary/30 p-5">
          {activeRate === null ? (
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
              <Calculator className="size-6 opacity-20" />
              <span className="text-sm">Enter details and fetch rate to see impact.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                  Base Value
                </span>
                <span className="font-mono text-base">${goodsValue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
                    Estimated Duty
                  </span>
                  <span className="font-mono text-xs text-amber-400">
                    @ {activeRate.toFixed(2)}%
                  </span>
                </div>
                <span className="font-mono text-base text-amber-400">
                  + ${Math.round(dutyAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-emerald-400" />
                  <span className="text-[11px] font-medium uppercase tracking-widest text-foreground">
                    Landed Cost
                  </span>
                </div>
                <span className="font-mono text-2xl font-bold text-emerald-400">
                  ${Math.round(landedCost).toLocaleString()}
                </span>
              </div>
              <div className="mt-auto flex justify-end">
                <Badge
                  variant="outline"
                  className={
                    overrideRate !== null
                      ? "border-primary/40 text-primary text-[10px]"
                      : "text-[10px] text-muted-foreground"
                  }
                >
                  {overrideRate !== null ? "Simulated Scenario" : "Official WITS Rate"}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
