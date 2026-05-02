"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="size-5 text-primary" />
          Landed Cost & Tariff Simulator
        </CardTitle>
        <CardDescription>
          Simulate duty impact using real World Bank WITS data or run &quot;what-if&quot; scenarios.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 border-r pr-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>HS-6 Code</Label>
              <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="e.g. 851712" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Goods Value ($)</Label>
              <Input 
                type="number" 
                value={goodsValue} 
                onChange={(e) => setGoodsValue(Number(e.target.value))} 
                min={0} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Origin (ISO-2)</Label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="CN" maxLength={2} className="uppercase" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Destination (ISO-2)</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="US" maxLength={2} className="uppercase" />
            </div>
          </div>
          
          <Button onClick={handleSimulate} disabled={loading || !hsCode || !origin || !destination} className="mt-2">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Globe className="mr-2 size-4" />}
            Fetch WITS Rate
          </Button>

          {rate !== null && (
            <div className="flex flex-col gap-2 mt-4 p-4 bg-muted/50 rounded-lg border border-dashed border-orange-500/30">
              <Label className="text-orange-500 font-semibold flex items-center gap-2">
                <RefreshCw className="size-4" />
                &quot;What-if&quot; Scenario
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Simulate geopolitical shifts (e.g. new trade war). Override the fetched {rate}% rate:
              </p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="0.5"
                  value={activeRate ?? rate} 
                  onChange={(e) => setOverrideRate(Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="font-mono w-12 text-right font-bold text-orange-500">
                  {activeRate?.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-6 p-6 bg-muted/30 rounded-xl border border-dashed">
          {activeRate === null ? (
            <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
              <Calculator className="size-8 opacity-20" />
              <span>Enter details and fetch rate to see impact.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Base Value</span>
                <span className="font-mono text-lg">${goodsValue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-4 border-dashed">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground">Estimated Duty</span>
                  <span className="text-xs text-orange-500 font-mono">@ {activeRate.toFixed(2)}%</span>
                </div>
                <span className="font-mono text-lg text-orange-500">+ ${Math.round(dutyAmount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-5 text-green-500" />
                  <span className="font-bold text-xl text-foreground">Landed Cost</span>
                </div>
                <span className="font-mono font-bold text-3xl text-green-500">
                  ${Math.round(landedCost).toLocaleString()}
                </span>
              </div>
              <div className="mt-auto flex justify-end">
                <Badge variant={overrideRate !== null ? "outline" : "secondary"} className={overrideRate !== null ? "border-orange-500 text-orange-500" : ""}>
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
