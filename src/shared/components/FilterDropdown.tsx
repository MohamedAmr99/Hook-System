import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface FilterDropdownOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterDropdownOption[];
  icon?: React.ReactNode;
  className?: string;
}

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  icon,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center justify-between gap-2 h-9 px-3 text-xs font-semibold rounded-md border border-border/80 bg-background/40 hover:bg-muted text-foreground/80 hover:text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary/30",
          value && "border-primary/40 bg-primary/5 text-primary-foreground/90 font-bold"
        )}
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <span>
            {label}: <span className="text-foreground">{selectedOption?.label || "All"}</span>
          </span>
        </div>
        <ChevronDown size={12} className={cn("opacity-60 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg z-50 animate-in fade-in-50 slide-in-from-top-1 duration-100">
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors text-foreground/80 hover:text-foreground hover:bg-muted",
                    isSelected && "bg-primary/10 text-primary-foreground font-bold hover:bg-primary/15"
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={12} className="text-primary" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
