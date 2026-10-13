import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { AssignmentModal } from "@/components/deliveries/AssignmentModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import type { Order, OrderMessage } from "@/types";
import { deliveriesService, driversService, ordersService } from "@/services";
import { ORDER_TRANSITIONS, TRANSITION_LABELS } from "@/lib/permissions";
import {
  PAYMENT_METHOD_LABELS,
  productLabel,
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

const errorMessage = (error: unknown, fallback: string) =>
  error && typeof error === "object" && "message" in error ? String(error.message) : fallback;

const SENDER_LABEL: Record<OrderMessage["sender"], string> = {
  customer: "Customer",
  nelma: "NELMA",
  system: "Update",
};

// The customer's delivery note and chat, with a reply box that sends straight to their app.
function Conversation({ order, canReply }: { order: Order; canReply: boolean }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const messages = order.messages ?? [];
  const reply = useMutation({
    mutationFn: (text: string) => ordersService.reply(order.id, text),
    onSuccess: (updated) => {
      setBody("");
      qc.setQueryData(["order", order.id], updated);
      toast.success("Reply sent to the customer");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not send the reply")),
  });
  return (
    <Panel title="Messages">
      {messages.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No messages about this order yet.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto py-1">
          {messages.map((m) => (
            <li
              key={m.id}
              className={
                m.sender === "nelma"
                  ? "ml-6 rounded-lg bg-primary/10 px-3 py-2"
                  : m.sender === "system"
                    ? "rounded-lg border border-dashed px-3 py-2"
                    : "mr-6 rounded-lg bg-muted px-3 py-2"
              }
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{SENDER_LABEL[m.sender]}</span>
                <span>{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
      {canReply ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim() && !reply.isPending) reply.mutate(body.trim());
          }}
        >
          <Label htmlFor="order-reply" className="sr-only">
            Reply to the customer
          </Label>
          <Textarea
            id="order-reply"
            value={body}
            maxLength={1200}
            rows={2}
            placeholder="Reply to the customer"
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!body.trim() || reply.isPending}>
            <Send className="mr-2 size-4" />
            {reply.isPending ? "Sending…" : "Send reply"}
          </Button>
        </form>
      ) : null}
    </Panel>
  );
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { can } = useAuth();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

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

  const cancel = useMutation({
    mutationFn: (why: string) => ordersService.cancel(id, why),
    onSuccess: () => {
      toast.success("Order cancelled");
      setCancelOpen(false);
      setReason("");
      void qc.invalidateQueries();
    },
    onError: (error) => toast.error(errorMessage(error, "Could not cancel this order")),
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
  const canCancel =
    can("orders.process") && !["delivered", "customer_received", "cancelled"].includes(o.status);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${o.customer.fullName} — ${productLabel(o.item.product, o.item.productName)}`}
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
            {canCancel ? (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="mr-2 size-4" /> Cancel order
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
            <Row label="Product" value={productLabel(o.item.product, o.item.productName)} />
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
          <Conversation order={o} canReply={can("orders.process")} />
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
        description={`This moves the order to "${next?.replace(/_/g, " ")}" and lets the customer know.`}
        confirmLabel={TRANSITION_LABELS[o.status] ?? "Confirm"}
        loading={advance.isPending}
        onConfirm={() => advance.mutate()}
      />

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              The customer is told it was cancelled, with your reason.
              {delivery?.driverId ? " The driver gets an alert and it leaves their route." : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              maxLength={300}
              placeholder="For example: customer asked by phone, out of stock"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 3 || cancel.isPending}
              onClick={() => cancel.mutate(reason.trim())}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
