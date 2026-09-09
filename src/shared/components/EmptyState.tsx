import * as React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-border/50 bg-card/45 backdrop-blur-sm min-h-[320px] shadow-sm animate-in fade-in zoom-in-95 duration-200",
      className
    )}>
      <div className="w-12 h-12 rounded-2xl bg-secondary/85 flex items-center justify-center mb-4 text-muted-foreground">
        {icon || <FolderOpen size={24} />}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          className="h-10 px-6 font-semibold shadow-sm hover:scale-[1.02] active:scale-95 transition-transform"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
