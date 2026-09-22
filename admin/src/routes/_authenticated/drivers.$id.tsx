import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Delivery } from "@/types";
import { PRODUCT_SHORT_LABELS, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/drivers/$id")({
  head: () => ({
    meta: [
      { title: "NELMA | Driver details" },
      {
        name: "description",
        content: "Driver profile, workload and assigned NELMA deliveries.",
      },
      { property: "og:title", content: "NELMA | Driver details" },
      {
        property: "og:description",
        content: "Driver profile, workload and assigned NELMA deliveries.",
      },
    ],
  }),
  component: DriverDetailPage,
});

function DriverDetailPage() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAction, setDeliveryAction] = useState<Delivery | null>(null);
  const updateDelivery = useMutation({
    mutationFn: (delivery: Delivery) =>
      deliveriesService.updateStatus(
        delivery.id,
        delivery.status === "assigned" ? "out_for_delivery" : "delivered",
      ),
    onSuccess: () => {
      toast.success("Delivery updated");
      setDeliveryAction(null);
      qc.invalidateQueries();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update delivery"),
  });

  const driver = useQuery({ queryKey: ["driver", id], queryFn: () => driversService.get(id) });
  const deliveries = useQuery({
    queryKey: ["driver", id, "deliveries"],
    queryFn: () => driversService.deliveriesFor(id),
  });

  useEffect(() => {
    if (driver.data) {
      setFullName(driver.data.fullName);
      setPhone(driver.data.phone);
    }
  }, [driver.data]);

  const save = useMutation({
    mutationFn: () => driversService.update(id, { fullName: fullName.trim(), phone: phone.trim() }),
    onSuccess: () => {
      toast.success("Driver details saved");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not save these details"),
  });

  const toggle = useMutation({
    mutationFn: () =>
      driversService.update(id, {
        status: driver.data?.status === "active" ? "inactive" : "active",
      }),
    onSuccess: () => {
      toast.success("Driver updated");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not update this driver"),
  });

  if (driver.isError) {
    return (
      <ErrorState description="This driver could not be loaded." onRetry={() => driver.refetch()} />
    );
  }
  if (driver.isLoading || !driver.data) return <LoadingSkeleton variant="detail" />;

  const d = driver.data;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/drivers">
          <ArrowLeft className="size-4" /> Back to drivers
        </Link>
      </Button>

      <PageHeader
        title={d.fullName}
        description={d.phone}
        actions={
          can("drivers.manage") ? (
            <Button variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate()}>
              {d.status === "active" ? "Deactivate driver" : "Activate driver"}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Status"
          value={d.status === "active" ? "Active" : "Inactive"}
          tone="neutral"
        />
        <StatCard label="Scheduled today" value={d.todayAssigned} />
        <StatCard label="Active deliveries" value={d.activeDeliveries} tone="warning" />
        <StatCard label="Completed" value={d.completedDeliveries} tone="green" />
      </div>

      {can("drivers.manage") ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-sm font-semibold text-foreground">Driver details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full name</Label>
              <Input
                id="edit-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone number</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <Button
            className="mt-4"
            disabled={save.isPending || fullName.trim().length < 3 || phone.trim().length < 9}
            onClick={() => save.mutate()}
          >
            Save changes
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Assigned deliveries</p>
        <p className="text-sm text-muted-foreground">
          Open an order to review its details, prepare it, reassign its driver, or record cash.
          {can("deliveries.update")
            ? " Dispatch prepared orders and mark completed deliveries below."
            : " A Sales Manager manages preparation, dispatch, delivery updates, and cash collection."}
        </p>
        {deliveries.isError ? (
          <ErrorState
            description="Deliveries could not be loaded."
            onRetry={() => deliveries.refetch()}
          />
        ) : deliveries.isLoading ? (
          <LoadingSkeleton variant="table" rows={3} />
        ) : (deliveries.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No deliveries assigned"
            description="This driver has no deliveries on record."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.data!.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        to="/orders/$id"
                        params={{ id: item.orderId }}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {item.customerName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.customerPhone}</p>
                    </TableCell>
                    <TableCell className="max-w-56">
                      <p>{item.location.area}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.location.addressLine}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{formatDate(item.scheduledDate)}</p>
                      <p className="text-xs text-muted-foreground">{item.timeWindow}</p>
                    </TableCell>
                    <TableCell>
                      {PRODUCT_SHORT_LABELS[item.product]} × {item.quantity}
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="delivery" status={item.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/orders/$id" params={{ id: item.orderId }}>
                            Open order
                          </Link>
                        </Button>
                        {can("deliveries.update") &&
                        (item.status === "assigned" || item.status === "out_for_delivery") ? (
                          <Button
                            size="sm"
                            disabled={
                              updateDelivery.isPending ||
                              (item.status === "assigned" &&
                                !!item.orderStatus &&
                                item.orderStatus !== "processing")
                            }
                            onClick={() => setDeliveryAction(item)}
                          >
                            {item.status === "assigned"
                              ? "Mark out for delivery"
                              : "Mark delivered"}
                          </Button>
                        ) : null}
                      </div>
                      {item.status === "assigned" &&
                      item.orderStatus &&
                      item.orderStatus !== "processing" ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Open the order and complete confirmation and preparation before dispatch.
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deliveryAction !== null}
        onOpenChange={(open) => {
          if (!open) setDeliveryAction(null);
        }}
        title={
          deliveryAction?.status === "assigned"
            ? "Send order out for delivery?"
            : "Mark order delivered?"
        }
        description={
          deliveryAction?.status === "assigned"
            ? `Confirm ${d.fullName} is leaving with this order for ${deliveryAction.customerName}.`
            : `Confirm the order has been delivered to ${deliveryAction?.customerName ?? "the customer"}. Cash payment must be recorded separately on the order.`
        }
        confirmLabel={
          deliveryAction?.status === "assigned" ? "Mark out for delivery" : "Mark delivered"
        }
        loading={updateDelivery.isPending}
        onConfirm={() => {
          if (deliveryAction) updateDelivery.mutate(deliveryAction);
        }}
      />
    </div>
  );
}
