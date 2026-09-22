import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  PAYMENT_METHOD_LABELS,
  PRODUCT_LABELS,
  formatDate,
  formatDateTime,
  formatTZS,
} from "@/lib/format";
import type { Order } from "@/types";

/** Compact order representation used on narrow screens and dashboard lists. */
export function OrderCard({ order, compact }: { order: Order; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {order.customer.fullName}
          </p>
          <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
        </div>
        <StatusBadge kind="order" status={order.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Product</dt>
          <dd className="text-foreground">
            {PRODUCT_LABELS[order.item.product]} × {order.item.quantity}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="tabular-nums text-foreground">{formatTZS(order.total)}</dd>
        </div>
        {!compact ? (
          <>
            <div>
              <dt className="text-muted-foreground">Ordered</dt>
              <dd className="text-foreground">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-foreground">
                {formatDate(order.requestedDeliveryDate)} · {order.requestedDeliveryWindow}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="text-foreground">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment status</dt>
              <dd>
                <StatusBadge kind="payment" status={order.paymentStatus} />
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
        <Link to="/orders/$id" params={{ id: order.id }}>
          View order
        </Link>
      </Button>
    </div>
  );
}
