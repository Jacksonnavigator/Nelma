import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
export type StatTone = "brand" | "green" | "mint" | "warning" | "neutral";
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  loading,
  compact = false,
  featured = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
  compact?: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "stat-card min-w-0",
        featured ? "stat-featured" : "stat-standard",
        compact && "stat-compact",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="stat-label">{label}</p>
        {Icon && (
          <Icon
            className={cn(
              "size-[18px] shrink-0",
              tone === "warning" && !featured && "text-warning",
            )}
            aria-hidden="true"
          />
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : (
        <p className="stat-value break-words tabular-nums">{value}</p>
      )}
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
  );
}
