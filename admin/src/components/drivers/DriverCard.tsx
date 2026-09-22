import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { initials } from "@/lib/format";
import type { Driver } from "@/types";

export function DriverCard({ driver, action }: { driver: Driver; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(driver.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{driver.fullName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" /> {driver.phone}
          </p>
        </div>
        <StatusBadge kind="account" status={driver.status} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-muted/60 p-2">
          <dt className="text-muted-foreground">Today</dt>
          <dd className="text-sm font-semibold text-foreground">{driver.todayAssigned}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 p-2">
          <dt className="text-muted-foreground">Active</dt>
          <dd className="text-sm font-semibold text-foreground">{driver.activeDeliveries}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 p-2">
          <dt className="text-muted-foreground">Completed</dt>
          <dd className="text-sm font-semibold text-foreground">{driver.completedDeliveries}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/drivers/$id" params={{ id: driver.id }}>
            View driver
          </Link>
        </Button>
        {action}
      </div>
    </div>
  );
}
