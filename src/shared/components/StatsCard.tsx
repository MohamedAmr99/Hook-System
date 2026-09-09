import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number; // percentage
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  isLoading = false,
  className,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className={cn("p-6 rounded-2xl border border-border/60 bg-card/60 shadow-sm animate-pulse space-y-3", className)}>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="w-8 h-8 rounded-full bg-muted"></div>
        </div>
        <div className="h-8 bg-muted rounded w-16"></div>
        <div className="h-3 bg-muted rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-2xl border border-border bg-card/75 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-primary/20",
      className
    )}>
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-8 -mt-8 group-hover:bg-primary/8 transition-colors duration-300" />
      
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
        
        {(trend || description) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm",
                trend.type === "increase" && "bg-emerald-500/10 text-emerald-500",
                trend.type === "decrease" && "bg-destructive/10 text-destructive",
                trend.type === "neutral" && "bg-muted-foreground/10 text-muted-foreground"
              )}>
                {trend.type === "increase" && <ArrowUpRight size={12} strokeWidth={2.5} />}
                {trend.type === "decrease" && <ArrowDownRight size={12} strokeWidth={2.5} />}
                {trend.type === "neutral" && <Minus size={12} strokeWidth={2.5} />}
                <span>{trend.value}%</span>
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground font-medium truncate">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
