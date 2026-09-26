import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { DataPagination } from "@/components/common/DataPagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { AssignmentModal } from "@/components/deliveries/AssignmentModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { deliveriesService, driversService } from "@/services";
import { isApiError } from "@/services/api";
import { PRODUCT_SHORT_LABELS, formatDate } from "@/lib/format";
import type { Delivery, DeliveryStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/deliveries")({
  head: () => ({
    meta: [
      { title: "NELMA | Deliveries" },
      {
        name: "description",
        content: "Assign drivers and track NELMA water deliveries through to customer receipt.",
      },
      { property: "og:title", content: "NELMA | Deliveries" },
      {
        property: "og:description",
        content: "Assign drivers and track NELMA water deliveries through to customer receipt.",
      },
    ],
  }),
  component: DeliveriesPage,
});

const VIEWS = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Unassigned" },
  { value: "assigned", label: "Assigned" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
] as const;

const NEXT_STATUS: Partial<Record<DeliveryStatus, { next: DeliveryStatus; label: string }>> = {
  assigned: { next: "out_for_delivery", label: "Mark out for delivery" },
  out_for_delivery: { next: "delivered", label: "Mark delivered" },
};

const PAGE_SIZE = 10;

function DeliveriesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Delivery | null>(null);

  const query = { page, pageSize: PAGE_SIZE, view, ...(search ? { search } : {}) };
  const deliveries = useQuery({
    queryKey: ["deliveries", query],
    queryFn: () => deliveriesService.list(query),
    placeholderData: keepPreviousData,
  });
  const drivers = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driversService.available(),
  });

  const assign = useMutation({
    mutationFn: (driverId: string) => deliveriesService.assignDriver(target!.id, driverId),
    onSuccess: () => {
      toast.success("Driver assigned");
      setTarget(null);
      qc.invalidateQueries();
    },
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Could not assign this driver"),
  });

  const updateStatus = useMutation({
    mutationFn: (input: { id: string; status: DeliveryStatus }) =>
      deliveriesService.updateStatus(input.id, input.status),
    onSuccess: () => {
      toast.success("Delivery updated");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not update this delivery"),
  });

  const driverName = (id: string | null) =>
    id ? (drivers.data?.find((d) => d.id === id)?.fullName ?? id) : "—";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Deliveries"
        description="Every scheduled delivery, its driver and current field status."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as typeof view);
            setPage(1);
          }}
        >
          <TabsList>
            {VIEWS.map((v) => (
              <TabsTrigger key={v.value} value={v.value}>
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search customer, area or phone"
        />
      </div>

      {deliveries.isError ? (
        <ErrorState
          description="Deliveries could not be loaded."
          onRetry={() => deliveries.refetch()}
        />
      ) : deliveries.isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : (deliveries.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No deliveries here" description="Nothing matches this view right now." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.data!.items.map((d) => {
                  const step = NEXT_STATUS[d.status];
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{d.customerName}</p>
                        <p className="text-xs text-muted-foreground">{d.customerPhone}</p>
                      </TableCell>
                      <TableCell className="max-w-56">
                        <p className="text-foreground">{d.location.area}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {d.location.addressLine}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{formatDate(d.scheduledDate)}</p>
                        <p className="text-xs text-muted-foreground">{d.timeWindow}</p>
                      </TableCell>
                      <TableCell>
                        {PRODUCT_SHORT_LABELS[d.product]} × {d.quantity}
                      </TableCell>
                      <TableCell>{driverName(d.driverId)}</TableCell>
                      <TableCell>
                        <StatusBadge kind="delivery" status={d.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {can("deliveries.assignDriver") &&
                          d.status !== "delivered" &&
                          d.status !== "customer_received" &&
                          d.status !== "cancelled" ? (
                            <Button size="sm" variant="outline" onClick={() => setTarget(d)}>
                              {d.driverId ? "Reassign" : "Assign"}
                            </Button>
                          ) : null}
                          {can("deliveries.update") && step ? (
                            <Button
                              size="sm"
                              disabled={
                                updateStatus.isPending ||
                                (step.next === "out_for_delivery" &&
                                  !!d.orderStatus &&
                                  d.orderStatus !== "processing")
                              }
                              title={
                                step.next === "out_for_delivery" &&
                                d.orderStatus &&
                                d.orderStatus !== "processing"
                                  ? "Start processing this order before dispatching it."
                                  : undefined
                              }
                              onClick={() => updateStatus.mutate({ id: d.id, status: step.next })}
                            >
                              {step.label}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DataPagination
            page={deliveries.data!.page}
            pageSize={deliveries.data!.pageSize}
            total={deliveries.data!.total}
            onPageChange={setPage}
          />
        </>
      )}

      <AssignmentModal
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        drivers={drivers.data ?? []}
        currentDriverId={target?.driverId ?? null}
        loading={assign.isPending}
        onAssign={(driverId) => assign.mutate(driverId)}
      />
    </div>
  );
}
