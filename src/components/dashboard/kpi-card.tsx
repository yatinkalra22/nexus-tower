import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
  accentColor?: string;
}

export function KPICard({ title, value, description, icon: Icon, trend, className, accentColor }: KPICardProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border",
      className
    )}>
      <div className={cn(
        "absolute inset-x-0 top-0 h-px",
        accentColor || "bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      )} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">{title}</span>
        <Icon className="size-3.5 text-muted-foreground/60" />
      </div>
      <div className="mt-2 font-mono text-2xl font-bold tracking-tight">{value}</div>
      {(description || trend) && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {trend && (
            <span className={cn("mr-1 font-mono font-medium", trend.isPositive ? "text-emerald-400" : "text-red-400")}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
          {description || trend?.label}
        </p>
      )}
    </div>
  );
}
