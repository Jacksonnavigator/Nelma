import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { FilterBar, FilterDate, FilterSelect } from "@/components/common/FilterBar";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CountBarChart, DistributionChart, SalesTrendChart } from "@/components/sales/SalesChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salesService } from "@/services";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PRODUCT_SHORT_LABELS,
  formatDate,
  formatNumber,
  formatTZS,
} from "@/lib/format";
import type { SalesPeriod } from "@/services/contracts";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "NELMA | Sales Reports" },
      {
        name: "description",
        content: "Sales performance, product mix and payment breakdown for NELMA water orders.",
      },
      { property: "og:title", content: "NELMA | Sales Reports" },
      {
        property: "og:description",
        content: "Sales performance, product mix and payment breakdown for NELMA water orders.",
      },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const [period, setPeriod] = useState<SalesPeriod>("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = {
    period,
    ...(period === "custom" && from ? { from } : {}),
    ...(period === "custom" && to ? { to } : {}),
  };
  const report = useQuery({
    queryKey: ["sales", query],
    queryFn: () => salesService.report(query),
    placeholderData: keepPreviousData,
    enabled: period !== "custom" || (!!from && !!to && from <= to),
  });

  const data = report.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales Reports"
        description="Paid sales use the payment date. Unpaid orders use the order date."
      />

      <FilterBar
        onClear={() => {
          setPeriod("week");
          setFrom("");
          setTo("");
        }}
        showClear={period !== "week"}
      >
        <FilterSelect
          label="Period"
          value={period}
          onChange={(v) => setPeriod(v as SalesPeriod)}
          options={[
            { value: "today", label: "Today" },
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
            { value: "custom", label: "Custom range" },
          ]}
        />
        {period === "custom" ? (
          <>
            <FilterDate label="From" value={from} onChange={setFrom} />
            <FilterDate label="To" value={to} onChange={setTo} />
          </>
        ) : null}
      </FilterBar>

      {period === "custom" && (!from || !to || from > to) ? (
        <p role="status" className="text-sm text-muted-foreground">
          Select both dates, with the start date on or before the end date.
        </p>
      ) : report.isError ? (
        <ErrorState
          description="The sales report could not be loaded."
          onRetry={() => report.refetch()}
        />
      ) : report.isLoading || !data ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="cards" />
          <LoadingSkeleton variant="chart" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total sales" value={formatTZS(data.summary.totalSales)} />
            <StatCard
              label="Orders"
              value={formatNumber(data.summary.totalOrders)}
              tone="neutral"
            />
            <StatCard label="Units sold" value={formatNumber(data.summary.unitsSold)} tone="mint" />
            <StatCard
              label="Pending payments"
              value={formatNumber(data.summary.pendingPayments)}
              tone="warning"
            />
            <StatCard
              label="Completed orders"
              value={formatNumber(data.summary.completedOrders)}
              tone="green"
            />
            <StatCard
              label="Cancelled orders"
              value={formatNumber(data.summary.cancelledOrders)}
              tone="neutral"
            />
            <StatCard
              label="First purchases"
              value={formatNumber(data.summary.firstPurchases)}
              tone="mint"
            />
            <StatCard label="Refills" value={formatNumber(data.summary.refills)} tone="mint" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SalesTrendChart
              data={data.trend.map((p) => ({ date: formatDate(p.date), sales: p.sales }))}
            />
            <CountBarChart
              title="Product mix"
              dataKey="orders"
              data={data.productMix.map((p) => ({ label: p.label, orders: p.orders }))}
            />
            <DistributionChart
              title="Order status distribution"
              data={data.statusDistribution.map((s) => ({
                label: ORDER_STATUS_LABELS[s.status],
                count: s.count,
              }))}
            />
            <DistributionChart
              title="Payment status"
              data={data.paymentDistribution.map((s) => ({ label: s.status, count: s.count }))}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Sales records</p>
            {data.records.length === 0 ? (
              <EmptyState title="No sales in this period" description="Try a wider date range." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.records.map((r) => (
                      <TableRow key={r.orderId}>
                        <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                        <TableCell className="font-medium text-foreground">{r.customer}</TableCell>
                        <TableCell>{PRODUCT_SHORT_LABELS[r.product]}</TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell>{PAYMENT_METHOD_LABELS[r.paymentMethod]}</TableCell>
                        <TableCell>
                          <StatusBadge kind="payment" status={r.paymentStatus} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium text-foreground">
                          {formatTZS(r.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
