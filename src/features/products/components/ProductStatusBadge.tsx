import { cn } from "@/shared/lib/utils";
import type { MarketplaceStatus } from "../types";

type BadgeVariant = "success" | "warning" | "error" | "neutral";

interface ProductStatusBadgeProps {
  type: "stock" | "marketplace";
  status: string | MarketplaceStatus;
  quantity?: number;
  reserved?: number;
  minAlert?: number;
  className?: string;
}

export function ProductStatusBadge({
  type,
  status,
  quantity = 0,
  reserved = 0,
  minAlert = 5,
  className,
}: ProductStatusBadgeProps) {
  let label = "";
  let variant: BadgeVariant = "neutral";
  let pulse = false;

  if (type === "stock") {
    const stock = quantity - reserved;
    if (stock <= 0) {
      label = `غير متوفر (${stock})`;
      variant = "error";
      pulse = true;
    } else if (stock <= minAlert) {
      label = `تحذير نقص مخزون (${stock})`;
      variant = "warning";
      pulse = true;
    } else {
      label = `متوفر (${stock})`;
      variant = "success";
    }
  } else {
    // Marketplace status
    switch (status as MarketplaceStatus) {
      case "Active":
        label = "نشط";
        variant = "success";
        break;
      case "Pending":
        label = "قيد الانتظار";
        variant = "warning";
        pulse = true;
        break;
      case "Suspended":
        label = "موقوف";
        variant = "error";
        break;
      case "Inactive":
      default:
        label = "غير نشط/مسودة";
        variant = "neutral";
        break;
    }
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 select-none",
      variant === "success" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      variant === "warning" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
      variant === "error" && "bg-destructive/10 text-destructive border-destructive/20",
      variant === "neutral" && "bg-muted text-muted-foreground border-border",
      className
    )}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            variant === "warning" && "bg-amber-400",
            variant === "error" && "bg-rose-400"
          )} />
          <span className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            variant === "warning" && "bg-amber-500",
            variant === "error" && "bg-rose-500"
          )} />
        </span>
      )}
      {!pulse && (
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          variant === "success" && "bg-emerald-500",
          variant === "neutral" && "bg-muted-foreground/60"
        )} />
      )}
      <span>{label}</span>
    </span>
  );
}
