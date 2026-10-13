import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
export type StatTone = "brand" | "green" | "mint" | "warning" | "neutral";
const TONES: Record<StatTone, string> = {
  brand: "bg-primary/10 text-primary",
  green: "bg-success/10 text-success",
  mint: "bg-brand-mint/25 text-accent-foreground",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-muted text-muted-foreground",
};
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  loading,
  compact = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "stat-card min-w-0 rounded-xl border border-border bg-card",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              TONES[tone],
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : (
        <p
          className={cn(
            "mt-3 break-words font-semibold leading-tight tracking-[-.04em] text-foreground tabular-nums",
            compact ? "text-2xl" : "text-[28px] xl:text-[32px]",
          )}
        >
          {value}
        </p>
      )}
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
