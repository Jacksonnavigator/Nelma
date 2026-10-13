import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/states";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Driver } from "@/types";

/**
 * Driver assignment / reassignment. The caller owns the mutation so this
 * component stays repository-agnostic.
 */
export function AssignmentModal({
  open,
  onOpenChange,
  drivers,
  currentDriverId,
  loading,
  onAssign,
  title = "Assign driver",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drivers: Driver[];
  currentDriverId?: string | null;
  loading?: boolean;
  onAssign: (driverId: string) => void;
  title?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const selectable = drivers.filter((d) => d.status === "active");
  const selectedDriver = selectable.find((d) => d.id === selected);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
          onOpenChange(next);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {currentDriverId
                ? "Choose a different active driver to reassign this delivery."
                : "Choose an active driver for this delivery."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {selectable.length === 0 ? (
              <EmptyState title="No active drivers" description="Activate a driver first." />
            ) : (
              selectable.map((driver) => {
                const isCurrent = driver.id === currentDriverId;
                const offDuty = driver.onDuty === false;
                return (
                  <button
                    key={driver.id}
                    type="button"
                    disabled={isCurrent || offDuty}
                    title={
                      offDuty ? `${driver.fullName} is off duty in the driver app.` : undefined
                    }
                    onClick={() => setSelected(driver.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected === driver.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/60",
                      (isCurrent || offDuty) && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(driver.fullName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {driver.fullName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {driver.todayAssigned} today · {driver.activeDeliveries} active ·{" "}
                        {offDuty ? "Off duty" : driver.available ? "Available" : "Busy"}
                      </span>
                    </span>
                    <StatusBadge kind="account" status={driver.status} />
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button disabled={!selected || loading} onClick={() => setConfirming(true)}>
              {currentDriverId ? "Reassign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={currentDriverId ? "Reassign this delivery?" : "Assign this delivery?"}
        description={
          selectedDriver
            ? `${selectedDriver.fullName} will handle this delivery.`
            : "This delivery will be assigned."
        }
        confirmLabel={currentDriverId ? "Reassign" : "Assign"}
        loading={loading === true}
        onConfirm={() => {
          if (!selected) return;
          onAssign(selected);
          setConfirming(false);
        }}
      />
    </>
  );
}
