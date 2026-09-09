import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            if (onClear) onClear();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
