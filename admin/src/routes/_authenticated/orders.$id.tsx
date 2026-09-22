import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { AssignmentModal } from "@/components/deliveries/AssignmentModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { deliveriesService, driversService, ordersService } from "@/services";
import { ORDER_TRANSITIONS, TRANSITION_LABELS } from "@/lib/permissions";
import {
  PAYMENT_METHOD_LABELS,
  PRODUCT_LABELS,
  formatDate,
  formatDateTime,
  formatNumber,
  formatTZS,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [
      { title: "NELMA | Order details" },
      {
        name: "description",
        content: "Full order record, delivery details, payment state and lifecycle history.",
      },
      { property: "og:title", content: "NELMA | Order details" },
      {
        property: "og:description",
        content: "Full order record, delivery details, payment state and lifecycle history.",
      },
    ],
  }),
  component: OrderDetailPage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);

  const order = useQuery({ queryKey: ["order", id], queryFn: () => ordersService.get(id) });
  const deliveries = useQuery({
    queryKey: ["deliveries", "for-order", id],
    queryFn: () => deliveriesService.forOrder(id),
  });
  const drivers = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driversService.available(),
  });

  const delivery = deliveries.data ?? null;

  const advance = useMutation({
    mutationFn: async () => {
      const status = order.data!.status;
      return status === "pending" ? ordersService.confirm(id) : ordersService.process(id);
    },
    onSuccess: () => {
      toast.success("Order updated");
      setConfirmOpen(false);
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not update this order"),
  });

  const assign = useMutation({
    mutationFn: (driverId: string) => deliveriesService.assignDriver(delivery!.id, driverId),
    onSuccess: () => {
      toast.success("Driver assigned");
      setAssignOpen(false);
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not assign this driver"),
  });

  const collectCash = useMutation({
    mutationFn: () => ordersService.collectCash(id, order.data!.total),
    onSuccess: () => {
      setCashOpen(false);
      toast.success("Cash collection recorded");
      void qc.invalidateQueries();
    },
    onError: (error) =>
      toast.error(
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Could not record cash collection",
      ),
  });

  if (order.isError) {
    return (
      <ErrorState description="This order could not be loaded." onRetry={() => order.refetch()} />
    );
  }
  if (order.isLoading || !order.data) return <LoadingSkeleton variant="detail" />;

  const o = order.data;
  const next = ORDER_TRANSITIONS[o.status];
  const canAdvance = can("orders.process") && !!next;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${o.customer.fullName} — ${PRODUCT_LABELS[o.item.product]}`}
        description={`Placed ${formatDateTime(o.createdAt)} · ${
          o.source === "USER_MOBILE" ? "Customer mobile app" : "Sales desk"
        }`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/orders">
                <ArrowLeft className="mr-2 size-4" /> Back to orders
              </Link>
            </Button>
            {delivery &&
            !["delivered", "customer_received", "cancelled"].includes(o.status) &&
            can("deliveries.assignDriver") ? (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <Truck className="mr-2 size-4" />
                {delivery.driverId ? "Reassign driver" : "Assign driver"}
              </Button>
            ) : null}
            {canAdvance ? (
              <Button onClick={() => setConfirmOpen(true)}>{TRANSITION_LABELS[o.status]}</Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge kind="order" status={o.status} />
        <StatusBadge kind="payment" status={o.paymentStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Order summary">
            <Row label="Product" value={PRODUCT_LABELS[o.item.product]} />
            <Row label="Quantity" value={formatNumber(o.item.quantity)} />
            <Row label="Unit price" value={formatTZS(o.item.unitPrice)} />
            <Row label="Subtotal" value={formatTZS(o.item.subtotal)} />
            <Row label="Delivery charge" value={formatTZS(o.deliveryCharge)} />
            <Row label="Total" value={<span className="text-base">{formatTZS(o.total)}</span>} />
          </Panel>

          <Panel title="Customer & delivery">
            <Row label="Customer" value={o.customer.fullName} />
            <Row label="Phone" value={o.customer.phone} />
            <Row label="Area" value={o.deliveryLocation.area} />
            <Row label="Address" value={o.deliveryLocation.addressLine} />
            {o.deliveryLocation.instructions ? (
              <Row label="Instructions" value={o.deliveryLocation.instructions} />
            ) : null}
            <Row label="Requested date" value={formatDate(o.requestedDeliveryDate)} />
            <Row label="Time window" value={o.requestedDeliveryWindow} />
            <Row
              label="Driver"
              value={
                delivery?.driverId
                  ? (drivers.data?.find((d) => d.id === delivery.driverId)?.fullName ??
                    delivery.driverId)
                  : "Not assigned"
              }
            />
          </Panel>

          <Panel title="Payment">
            {o.cashReceipt && (
              <>
                <Row label="Receipt" value={o.cashReceipt.id} />
                <Row label="Cash collected" value={formatTZS(o.cashReceipt.amount)} />
                <Row label="Recorded at" value={formatDateTime(o.cashReceipt.collectedAt)} />
              </>
            )}
            {can("payments.collectCash") &&
              o.paymentMethod === "cash" &&
              o.paymentStatus === "pending" &&
              ["delivered", "customer_received"].includes(o.status) && (
                <Button className="mb-3" onClick={() => setCashOpen(true)}>
                  Record cash received
                </Button>
              )}
            <Row label="Method" value={PAYMENT_METHOD_LABELS[o.paymentMethod]} />
            <Row label="Status" value={<StatusBadge kind="payment" status={o.paymentStatus} />} />
            <Row
              label="Order placed by"
              value={o.createdBy ? o.createdBy.fullName : "Customer (mobile app)"}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Order lifecycle">
            <OrderTimeline order={o} />
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={cashOpen}
        onOpenChange={setCashOpen}
        title="Record cash received?"
        description={`Confirm that the full ${formatTZS(o.total)} has been received for this order. This records a paid cash receipt and updates sales totals.`}
        confirmLabel="Confirm cash received"
        loading={collectCash.isPending}
        onConfirm={() => collectCash.mutate()}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={TRANSITION_LABELS[o.status] ?? "Update order"}
        description={`This moves the order to "${next}". The backend remains the source of truth.`}
        confirmLabel={TRANSITION_LABELS[o.status] ?? "Confirm"}
        loading={advance.isPending}
        onConfirm={() => advance.mutate()}
      />

      {delivery ? (
        <AssignmentModal
          open={assignOpen}
          onOpenChange={setAssignOpen}
          drivers={drivers.data ?? []}
          currentDriverId={delivery.driverId}
          loading={assign.isPending}
          onAssign={(driverId) => assign.mutate(driverId)}
        />
      ) : null}
    </div>
  );
}
