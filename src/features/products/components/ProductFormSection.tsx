import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface ProductFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ProductFormSection({
  title,
  description,
  children,
  className,
}: ProductFormSectionProps) {
  return (
    <section className={cn("p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4 animate-in fade-in duration-350", className)}>
      <div className="border-b border-border/50 pb-3">
        <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {children}
      </div>
    </section>
  );
}
