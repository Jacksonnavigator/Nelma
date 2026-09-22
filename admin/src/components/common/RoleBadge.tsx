import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        role === "SYSTEM_ADMIN"
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-brand-green/35 bg-brand-green/20 text-foreground",
        className,
      )}
    >
      {role === "SYSTEM_ADMIN" || role === "SALES_MANAGER"
        ? ROLE_LABELS[role]
        : role === "USER"
          ? "Customer"
          : role === "DRIVER"
            ? "Driver"
            : role === "SYSTEM"
              ? "System"
              : role}
    </span>
  );
}
