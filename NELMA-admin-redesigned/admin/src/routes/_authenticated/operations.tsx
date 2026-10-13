import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Flag, Hourglass, MapPin, RefreshCw, Wallet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { AssignmentModal } from "@/components/deliveries/AssignmentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { deliveriesService, driversService, operationsService } from "@/services";
import { isApiError } from "@/services/api";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatRelative, formatTZS } from "@/lib/format";
import type {
  DeliveryFlag,
  DeliveryFlagKind,
  DriverCashBalance,
  DriverOnDuty,
  StalledAssignment,
  StalledKind,
} from "@/types";

export const Route = createFileRoute("/_authenticated/operations")({
  head: () => ({
    meta: [
      { title: "NELMA | Operations" },
      {
        name: "description",
        content:
          "Cash held by drivers, deliveries that need a second look and stalled assignments.",
      },
    ],
  }),
  component: OperationsPage,
});

const FLAG_LABELS: Record<DeliveryFlagKind, { label: string; tone: string }> = {
  proof_skipped: { label: "No delivery code", tone: "bg-warning/15 text-warning" },
  far_from_address: { label: "Far from address", tone: "bg-destructive/10 text-destructive" },
  delivery_issue: { label: "Problem reported", tone: "bg-primary/10 text-primary" },
  declined: { label: "Declined", tone: "bg-muted text-muted-foreground" },
  code_locked: { label: "Code guessing", tone: "bg-destructive/10 text-destructive" },
};

const STALL_COPY: Record<StalledKind, { label: string; hint: string }> = {
  not_accepted: { label: "Not accepted", hint: "The driver has not opened this assignment." },
  not_started: { label: "Not started", hint: "Accepted but still waiting to leave." },
  driver_off_duty: { label: "Driver off duty", hint: "Assigned to a driver who went off duty." },
};

/** Cash held this long is worth a phone call. */
const OLD_CASH_HOURS = 12;

function OperationsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [handInFor, setHandInFor] = useState<DriverCashBalance | null>(null);
  const [reassign, setReassign] = useState<StalledAssignment | null>(null);

  const overview = useQuery({
    queryKey: ["operations"],
    queryFn: () => operationsService.overview(),
    refetchInterval: 60_000,
  });
  const drivers = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driversService.available(),
    enabled: !!reassign,
  });

  const review = useMutation({
    mutationFn: (id: string) => operationsService.reviewFlag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operations"] }),
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Could not update this flag"),
  });
  const assign = useMutation({
    mutationFn: (driverId: string) => deliveriesService.assignDriver(reassign!.orderId!, driverId),
    onSuccess: () => {
      toast.success("Delivery reassigned");
      setReassign(null);
      qc.invalidateQueries();
    },
    onError: (error) => toast.error(isApiError(error) ? error.message : "Could not reassign"),
  });

  const data = overview.data;
  const cashTotal = data?.cash.reduce((sum, entry) => sum + entry.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="What needs a decision today: money still in the field, stops going nowhere, and deliveries worth a second look."
        actions={
          <>
            {data ? (
              <span className="text-xs text-muted-foreground">
                Updated {formatRelative(data.generatedAt)}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={overview.isFetching}
              onClick={() => overview.refetch()}
            >
              <RefreshCw className={cn("size-4", overview.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </>
        }
      />

      {overview.isError ? (
        <ErrorState
          description="Operations could not be loaded."
          onRetry={() => overview.refetch()}
        />
      ) : overview.isLoading || !data ? (
        <LoadingSkeleton variant="table" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Cash with drivers"
              value={formatTZS(cashTotal)}
              hint={
                data.cash.length
                  ? `${data.cash.length} ${data.cash.length === 1 ? "driver" : "drivers"} to settle`
                  : "Everything is handed in"
              }
              icon={Wallet}
              tone={data.cash.length ? "warning" : "green"}
            />
            <StatCard
              label="Stalled stops"
              value={data.stalled.length}
              hint="Assigned but not moving"
              icon={Hourglass}
              tone={data.stalled.length ? "warning" : "neutral"}
            />
            <StatCard
              label="Flags to review"
              value={data.flags.length}
              hint="Last 30 days"
              icon={Flag}
              tone={data.flags.length ? "brand" : "neutral"}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <div className="space-y-6 xl:col-span-3">
              <Section
                title="Stalled stops"
                caption="Assignments that are waiting on a driver. Reassign or call the driver."
              >
                {data.stalled.length === 0 ? (
                  <EmptyState title="Nothing stuck" description="Every assigned stop is moving." />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.stalled.map((row) => (
                      <StalledRow
                        key={`${row.orderId ?? row.orderNumber}-${row.kind}`}
                        row={row}
                        canReassign={can("deliveries.assignDriver") && !!row.orderId}
                        onReassign={() => setReassign(row)}
                      />
                    ))}
                  </ul>
                )}
              </Section>

              <Section
                title="Flagged deliveries"
                caption="Handed over without the customer's code, far from the address, declined or reported. Clear each one once you have checked it."
              >
                {data.flags.length === 0 ? (
                  <EmptyState title="No flags" description="Nothing unusual in the last 30 days." />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.flags.map((flag) => (
                      <FlagRow
                        key={flag.id}
                        flag={flag}
                        busy={review.isPending && review.variables === flag.id}
                        onReview={() => review.mutate(flag.id)}
                      />
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <div className="space-y-6 xl:col-span-2">
              {data.drivers ? (
                <Section
                  title="On duty now"
                  caption="Positions come from the driver app about once a minute while it is open."
                >
                  {data.drivers.length === 0 ? (
                    <EmptyState
                      title="Nobody on duty"
                      description="Drivers switch on duty in their app."
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {data.drivers.map((driver) => (
                        <DutyRow key={driver.driverId} driver={driver} />
                      ))}
                    </ul>
                  )}
                </Section>
              ) : null}

              <Section
                title="Cash with drivers"
                caption="Cash confirmed at the door but not yet brought to the office."
              >
                {data.cash.length === 0 ? (
                  <EmptyState title="All settled" description="No driver is holding NELMA cash." />
                ) : (
                  <div className="space-y-3 p-4">
                    {data.cash.map((entry) => (
                      <CashCard
                        key={entry.driverId}
                        entry={entry}
                        canSettle={can("payments.collectCash")}
                        onSettle={() => setHandInFor(entry)}
                      />
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </>
      )}

      <HandInDialog entry={handInFor} onClose={() => setHandInFor(null)} />

      <AssignmentModal
        open={!!reassign}
        onOpenChange={(open) => !open && setReassign(null)}
        drivers={drivers.data ?? []}
        currentDriverId={reassign?.driverId ?? null}
        loading={assign.isPending}
        onAssign={(driverId) => assign.mutate(driverId)}
        title="Reassign stalled stop"
      />
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
      </header>
      {children}
    </section>
  );
}

function OrderRef({
  orderId,
  orderNumber,
}: {
  orderId: string | null;
  orderNumber: string | null;
}) {
  const label = orderNumber ?? "Order";
  return orderId ? (
    <Link
      to="/orders/$id"
      params={{ id: orderId }}
      className="font-mono text-xs text-primary underline-offset-2 hover:underline"
    >
      {label}
    </Link>
  ) : (
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
  );
}

function StalledRow({
  row,
  canReassign,
  onReassign,
}: {
  row: StalledAssignment;
  canReassign: boolean;
  onReassign: () => void;
}) {
  const copy = STALL_COPY[row.kind];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            title={copy.hint}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              row.kind === "driver_off_duty"
                ? "bg-destructive/10 text-destructive"
                : "bg-warning/15 text-warning",
            )}
          >
            {copy.label}
          </span>
          <OrderRef orderId={row.orderId} orderNumber={row.orderNumber} />
        </div>
        <p className="mt-1 text-sm text-foreground">
          {row.customerName ?? "Customer"}
          {row.area ? <span className="text-muted-foreground"> · {row.area}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.driverName}
          {row.since
            ? ` · ${row.kind === "not_started" ? "accepted" : "assigned"} ${formatRelative(row.since)}`
            : ""}
          {row.scheduledDate ? ` · due ${formatDate(row.scheduledDate)}` : ""}
          {row.timeWindow ? `, ${row.timeWindow}` : ""}
        </p>
      </div>
      {canReassign ? (
        <Button size="sm" variant="outline" onClick={onReassign}>
          Reassign
        </Button>
      ) : null}
    </li>
  );
}

function FlagRow({
  flag,
  busy,
  onReview,
}: {
  flag: DeliveryFlag;
  busy: boolean;
  onReview: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {flag.kinds.map((kind) => (
            <span
              key={kind}
              className={cn("rounded-md px-2 py-0.5 text-xs font-medium", FLAG_LABELS[kind].tone)}
            >
              {FLAG_LABELS[kind].label}
            </span>
          ))}
          <OrderRef orderId={flag.orderId} orderNumber={flag.orderNumber} />
        </div>
        <p className="mt-1 text-sm text-foreground">{flag.detail}</p>
        <p className="text-xs text-muted-foreground">
          {flag.driverName}
          {flag.customerName ? ` → ${flag.customerName}` : ""}
          {flag.area ? `, ${flag.area}` : ""} · {formatDateTime(flag.at)}
        </p>
      </div>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onReview}>
        {busy ? "Saving…" : "Mark checked"}
      </Button>
    </li>
  );
}

/** A position older than this is shown as stale: the app is closed or the phone lost signal. */
const STALE_POSITION_MINUTES = 15;

function DutyRow({ driver }: { driver: DriverOnDuty }) {
  const position = driver.lastLocation;
  const stale =
    !position?.at || Date.now() - new Date(position.at).getTime() > STALE_POSITION_MINUTES * 60_000;
  const load = [
    driver.onTheRoad ? `${driver.onTheRoad} on the road` : null,
    driver.waiting ? `${driver.waiting} waiting` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{driver.driverName}</p>
        <p className="text-xs text-muted-foreground">
          <a href={`tel:${driver.driverPhone}`} className="hover:underline">
            {driver.driverPhone}
          </a>
          {" · "}
          {load || "No stops"}
        </p>
      </div>
      {position ? (
        <a
          href={`https://www.google.com/maps?q=${position.latitude},${position.longitude}`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs hover:underline",
            stale ? "text-muted-foreground" : "font-medium text-primary",
          )}
          title={stale ? "The app has not reported a position recently." : undefined}
        >
          <MapPin className="size-3.5" />
          {position.at ? formatRelative(position.at) : "Map"}
        </a>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">No position yet</span>
      )}
    </li>
  );
}

function CashCard({
  entry,
  canSettle,
  onSettle,
}: {
  entry: DriverCashBalance;
  canSettle: boolean;
  onSettle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ageHours = (Date.now() - new Date(entry.oldestAt).getTime()) / 3_600_000;
  const overdue = ageHours >= OLD_CASH_HOURS;
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        overdue ? "border-warning/60 bg-warning/5" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{entry.driverName}</p>
          <p className="text-xs text-muted-foreground">
            <a href={`tel:${entry.driverPhone}`} className="hover:underline">
              {entry.driverPhone}
            </a>{" "}
            · {entry.onDuty ? "On duty" : "Off duty"}
          </p>
        </div>
        <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
          {formatTZS(entry.amount)}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 text-xs",
          overdue ? "font-medium text-warning" : "text-muted-foreground",
        )}
      >
        {entry.receipts.length} {entry.receipts.length === 1 ? "receipt" : "receipts"}, oldest{" "}
        {formatRelative(entry.oldestAt)}
      </p>

      {open ? (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {entry.receipts.map((receipt) => (
            <li
              key={receipt.paymentId}
              className="flex items-baseline justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate">
                <OrderRef orderId={receipt.orderId} orderNumber={receipt.orderNumber} />{" "}
                <span className="text-muted-foreground">{receipt.customerName}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatTZS(receipt.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          {open ? "Hide receipts" : "Show receipts"}
        </button>
        {canSettle ? (
          <Button size="sm" onClick={onSettle}>
            Record hand-in
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function HandInDialog({
  entry,
  onClose,
}: {
  entry: DriverCashBalance | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [counted, setCounted] = useState("");
  const amount = Number(counted.replace(/[^\d]/g, ""));
  const settle = useMutation({
    mutationFn: () =>
      operationsService.handIn(
        entry!.driverId,
        entry!.receipts.map((r) => r.paymentId),
        amount,
      ),
    onSuccess: (result) => {
      toast.success(`${formatTZS(result.settled)} received from ${entry!.driverName}`);
      setCounted("");
      onClose();
      qc.invalidateQueries({ queryKey: ["operations"] });
    },
  });
  const close = () => {
    setCounted("");
    settle.reset();
    onClose();
  };

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cash from {entry?.driverName}</DialogTitle>
          <DialogDescription>
            Count the money first, then enter what you actually received. It has to match{" "}
            {entry ? formatTZS(entry.amount) : ""} from {entry?.receipts.length} receipts.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (counted) settle.mutate();
          }}
        >
          <Label htmlFor="counted">Amount counted (TZS)</Label>
          <Input
            id="counted"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={counted}
            onChange={(event) => setCounted(event.target.value)}
            placeholder="e.g. 26000"
          />
          {settle.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {isApiError(settle.error) ? settle.error.message : "Could not record this hand-in."}
            </p>
          ) : null}
          {entry && counted && amount !== entry.amount && !settle.isError ? (
            <Badge variant="outline" className="font-normal">
              {amount < entry.amount
                ? `${formatTZS(entry.amount - amount)} short`
                : `${formatTZS(amount - entry.amount)} over`}
            </Badge>
          ) : null}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={close} disabled={settle.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!counted || settle.isPending}>
              {settle.isPending ? "Saving…" : "Confirm hand-in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
