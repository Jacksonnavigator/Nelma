import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function FilterBar({
  children,
  onClear,
  showClear,
}: {
  children: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
      {children}
      {onClear ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!showClear}
          className="ml-auto"
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className = "w-44",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={className} aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="date"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="w-40"
      />
    </div>
  );
}
