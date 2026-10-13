import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-12"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
