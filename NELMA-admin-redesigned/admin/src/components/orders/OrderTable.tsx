import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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
  productLabel,
  formatDate,
  formatDateTime,
  formatTZS,
} from "@/lib/format";
import type { Order } from "@/types";

export type OrderSortKey = "createdAt" | "requestedDeliveryDate" | "total";
/** Related details share a column, reducing scanning and horizontal travel. */
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
  const sortLabel = (key: OrderSortKey, label: string) => {
    const Icon = sortKey !== key ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return onSort ? (
      <button
        type="button"
        onClick={() => onSort(key)}
        className="inline-flex min-h-11 items-center gap-2 font-medium hover:text-foreground"
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    ) : (
      label
    );
  };
  const ariaSort = (key: OrderSortKey): "ascending" | "descending" | "none" =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <caption className="sr-only">
          Customer water orders. Use the column buttons to sort orders on this page.
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead aria-sort={ariaSort("createdAt")}>
              {sortLabel("createdAt", "Ordered")}
            </TableHead>
            <TableHead aria-sort={ariaSort("requestedDeliveryDate")}>
              {sortLabel("requestedDeliveryDate", "Delivery")}
            </TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right" aria-sort={ariaSort("total")}>
              {sortLabel("total", "Total")}
            </TableHead>
            <TableHead>Order status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <p className="whitespace-nowrap font-semibold text-foreground">
                  {order.customer.fullName}
                </p>
                <p className="mt-1 whitespace-nowrap text-sm text-muted-foreground">
                  {order.customer.phone}
                </p>
              </TableCell>
              <TableCell>
                <p className="whitespace-nowrap">
                  {productLabel(order.item.product, order.item.productName)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Qty: {order.item.quantity}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </TableCell>
              <TableCell>
                <p className="whitespace-nowrap">{formatDate(order.requestedDeliveryDate)}</p>
                <p className="mt-1 whitespace-nowrap text-sm text-muted-foreground">
                  {order.requestedDeliveryWindow}
                </p>
              </TableCell>
              <TableCell>
                <StatusBadge kind="payment" status={order.paymentStatus} />
                <p className="mt-1 text-sm text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                {formatTZS(order.total)}
              </TableCell>
              <TableCell>
                <StatusBadge kind="order" status={order.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/orders/$id"
                    params={{ id: order.id }}
                    aria-label={`View order for ${order.customer.fullName}`}
                  >
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
