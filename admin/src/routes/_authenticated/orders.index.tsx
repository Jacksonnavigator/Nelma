import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterBar, FilterDate, FilterSelect } from "@/components/common/FilterBar";
import { DataPagination } from "@/components/common/DataPagination";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { OrderTable, type OrderSortKey } from "@/components/orders/OrderTable";
import { OrderCard } from "@/components/orders/OrderCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ordersService } from "@/services";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PRODUCT_LABELS,
} from "@/lib/format";
import type { Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "NELMA | Orders" },
      {
        name: "description",
        content: "Search, filter and process NELMA drinking water orders.",
      },
      { property: "og:title", content: "NELMA | Orders" },
      { property: "og:description", content: "Search, filter and process NELMA water orders." },
    ],
  }),
  component: OrdersPage,
});

const PAGE_SIZE = 10;

function OrdersPage() {
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [product, setProduct] = useState<OrderType | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">("all");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [sortKey, setSortKey] = useState<OrderSortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const query = {
    page,
    pageSize: PAGE_SIZE,
    ...(search ? { search } : {}),
    status,
    product,
    paymentMethod,
    paymentStatus,
    ...(orderDate ? { orderDate } : {}),
    ...(deliveryDate ? { deliveryDate } : {}),
  };

  const orders = useQuery({
    queryKey: ["orders", query],
    queryFn: () => ordersService.list(query),
    placeholderData: keepPreviousData,
  });

  const sorted = useMemo(() => {
    const items = [...(orders.data?.items ?? [])];
    items.sort((a: Order, b: Order) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "total") return (a.total - b.total) * dir;
      const av = sortKey === "createdAt" ? a.createdAt : a.requestedDeliveryDate;
      const bv = sortKey === "createdAt" ? b.createdAt : b.requestedDeliveryDate;
      return (+new Date(av) - +new Date(bv)) * dir;
    });
    return items;
  }, [orders.data, sortKey, sortDir]);

  const filtersActive =
    !!search ||
    status !== "all" ||
    product !== "all" ||
    paymentMethod !== "all" ||
    paymentStatus !== "all" ||
    !!orderDate ||
    !!deliveryDate;

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setProduct("all");
    setPaymentMethod("all");
    setPaymentStatus("all");
    setOrderDate("");
    setDeliveryDate("");
    setPage(1);
  }

  function onSort(key: OrderSortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="All customer water orders from the mobile app and the sales desk."
        actions={
          can("orders.create") ? (
            <Button asChild>
              <Link to="/create-order">
                <PlusCircle className="mr-2 size-4" /> Create Order
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search customer name or phone"
        />
      </div>

      <FilterBar onClear={clearFilters} showClear={filtersActive}>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v as OrderStatus | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All statuses" },
            ...(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => ({
              value: s,
              label: ORDER_STATUS_LABELS[s],
            })),
          ]}
        />
        <FilterSelect
          label="Product"
          value={product}
          onChange={(v) => {
            setProduct(v as OrderType | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All products" },
            { value: "first_purchase", label: PRODUCT_LABELS.first_purchase },
            { value: "refill", label: PRODUCT_LABELS.refill },
          ]}
        />
        <FilterSelect
          label="Payment method"
          value={paymentMethod}
          onChange={(v) => {
            setPaymentMethod(v as PaymentMethod | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All methods" },
            { value: "cash", label: PAYMENT_METHOD_LABELS.cash },
            { value: "mobile_money", label: PAYMENT_METHOD_LABELS.mobile_money },
          ]}
        />
        <FilterSelect
          label="Payment status"
          value={paymentStatus}
          onChange={(v) => {
            setPaymentStatus(v as PaymentStatus | "all");
            setPage(1);
          }}
          options={[
            { value: "all", label: "All payments" },
            ...(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => ({
              value: s,
              label: PAYMENT_STATUS_LABELS[s],
            })),
          ]}
        />
        <FilterDate
          label="Order date"
          value={orderDate}
          onChange={(v) => {
            setOrderDate(v);
            setPage(1);
          }}
        />
        <FilterDate
          label="Delivery date"
          value={deliveryDate}
          onChange={(v) => {
            setDeliveryDate(v);
            setPage(1);
          }}
        />
      </FilterBar>

      {orders.isError ? (
        <ErrorState description="Orders could not be loaded." onRetry={() => orders.refetch()} />
      ) : orders.isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No orders match these filters"
          description="Try a different search term, date or status."
          action={
            filtersActive ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <OrderTable orders={sorted} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {sorted.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <DataPagination
            page={orders.data!.page}
            pageSize={orders.data!.pageSize}
            total={orders.data!.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
