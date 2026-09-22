import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  PAYMENT_METHOD_LABELS,
  PRODUCT_LABELS,
  formatDate,
  formatDateTime,
  formatTZS,
} from "@/lib/format";
import type { Order } from "@/types";

export type OrderSortKey = "createdAt" | "requestedDeliveryDate" | "total";

/**
 * Desktop/tablet order table. Order identifiers are deliberately not shown as
 * a column — the customer is the primary label.
 */
export function OrderTable({
  orders,
  sortKey,
  sortDir,
  onSort,
}: {
  orders: Order[];
  sortKey?: OrderSortKey;
  sortDir?: "asc" | "desc";
  onSort?: (key: OrderSortKey) => void;
}) {
  const sortLabel = (key: OrderSortKey, label: string) =>
    onSort ? (
      <button
        type="button"
        onClick={() => onSort(key)}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      >
        {label}
        {sortKey === key ? <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span> : null}
      </button>
    ) : (
      label
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>{sortLabel("createdAt", "Ordered")}</TableHead>
            <TableHead>{sortLabel("requestedDeliveryDate", "Delivery")}</TableHead>
            <TableHead>Time window</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Payment status</TableHead>
            <TableHead className="text-right">{sortLabel("total", "Total")}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium text-foreground">
                {order.customer.fullName}
              </TableCell>
              <TableCell className="whitespace-nowrap">{order.customer.phone}</TableCell>
              <TableCell className="whitespace-nowrap">
                {PRODUCT_LABELS[order.item.product]}
              </TableCell>
              <TableCell className="text-right tabular-nums">{order.item.quantity}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(order.createdAt)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(order.requestedDeliveryDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">{order.requestedDeliveryWindow}</TableCell>
              <TableCell>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</TableCell>
              <TableCell>
                <StatusBadge kind="payment" status={order.paymentStatus} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">
                {formatTZS(order.total)}
              </TableCell>
              <TableCell>
                <StatusBadge kind="order" status={order.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link to="/orders/$id" params={{ id: order.id }}>
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
