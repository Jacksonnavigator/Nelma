import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Truck,
  ClipboardList,
  Wallet,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SalesTrendChart } from "@/components/sales/SalesChart";
import { DriverCard } from "@/components/drivers/DriverCard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatNumber, formatRelative, formatTZS, productLabel } from "@/lib/format";
import {
  deliveriesService,
  driversService,
  ordersService,
  salesService,
  DATA_MODE,
} from "@/services";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "NELMA | Today's operations" },
      { name: "description", content: "NELMA orders, dispatch and sales in one working overview." },
    ],
  }),
  component: DashboardPage,
});

function WorkPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("work-panel", className)}>
      <div className="work-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DashboardPage() {
  const { user, can } = useAuth();
  const role = user!.role;
  const isAdmin = role === "SYSTEM_ADMIN";
  const [queue, setQueue] = useState<"orders" | "deliveries">("orders");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => ordersService.metrics() });
  const recent = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => ordersService.list({ page: 1, pageSize: 6 }),
  });
  const attention = useQuery({
    queryKey: ["orders", "attention"],
    queryFn: () => ordersService.list({ page: 1, pageSize: 5, status: "pending" }),
  });
  const unassigned = useQuery({
    queryKey: ["deliveries", "unassigned"],
    queryFn: () => deliveriesService.list({ page: 1, pageSize: 5, view: "unassigned" }),
  });
  const activity = useQuery({
    queryKey: ["activity", role],
    queryFn: () => ordersService.activity(role),
  });
  const drivers = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driversService.available(),
  });
  const report = useQuery({
    queryKey: ["sales", period],
    queryFn: () => salesService.report({ period }),
  });
  if (metrics.isError)
    return (
      <ErrorState
        description="Today's operations could not be loaded."
        onRetry={() => metrics.refetch()}
      />
    );
  const m = metrics.data;
  const n = (value: number | undefined) => (metrics.isLoading ? "—" : formatNumber(value ?? 0));
  return (
    <div className="operations-dashboard">
      <PageHeader
        title="Today's operations"
        description="Orders, water deliveries, and the people keeping them moving."
        actions={
          <>
            {DATA_MODE === "mock" && <span className="demo-label">Demo data</span>}
            <Button asChild variant="outline">
              <Link to="/sales">
                View reports
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            {can("orders.create") && (
              <Button asChild>
                <Link to="/create-order">
                  <Plus aria-hidden="true" />
                  Create order
                </Link>
              </Button>
            )}
          </>
        }
      />

      <section aria-label="Today's key figures" className="overview-metrics">
        <StatCard
          featured
          label="Sales today"
          value={formatTZS(m?.todaySales ?? 0)}
          hint="Sales recorded today · TZS"
          icon={Wallet}
          loading={metrics.isLoading}
        />
        <StatCard
          label="Orders today"
          value={n(m?.todayOrders)}
          hint="Customer water orders"
          icon={ClipboardList}
          loading={metrics.isLoading}
        />
        <StatCard
          label="Active drivers"
          value={n(m?.activeDrivers)}
          hint="On the platform"
          icon={Truck}
          loading={metrics.isLoading}
        />
        <StatCard
          label="Pending payments"
          value={n(m?.pendingPayments)}
          hint="Awaiting payment"
          icon={Clock3}
          tone="warning"
          loading={metrics.isLoading}
        />
      </section>

      <div className="dashboard-primary">
        <WorkPanel
          title={`Sales this ${period}`}
          description="Recorded sales, in Tanzanian shillings (TZS)."
          className="sales-work-panel"
          action={
            <div className="period-switch" role="group" aria-label="Sales period">
              {(["week", "month"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value)}
                >
                  {value === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          }
        >
          {report.isError ? (
            <ErrorState
              description="Sales data could not be loaded."
              onRetry={() => report.refetch()}
            />
          ) : report.isLoading ? (
            <LoadingSkeleton variant="chart" />
          ) : (
            <SalesTrendChart
              bare
              title={`Sales this ${period}`}
              data={(report.data?.trend ?? []).map((point) => ({
                date: formatDate(point.date).slice(0, 6),
                sales: point.sales,
              }))}
            />
          )}
          <div className="delivery-flow" aria-label="Delivery summary">
            <div>
              <span className="flow-key flow-pending" aria-hidden="true" />
              <p>
                Pending delivery<strong>{n(m?.pendingDeliveries)}</strong>
              </p>
            </div>
            <div>
              <span className="flow-key flow-road" aria-hidden="true" />
              <p>
                On the road<strong>{n(m?.outForDelivery)}</strong>
              </p>
            </div>
            <div>
              <span className="flow-key flow-done" aria-hidden="true" />
              <p>
                Completed today<strong>{n(m?.completedToday)}</strong>
              </p>
            </div>
          </div>
        </WorkPanel>

        <WorkPanel
          title="Dispatch desk"
          description="The next tasks for your team."
          className="dispatch-panel"
          action={<Truck className="size-5 text-primary" aria-hidden="true" />}
        >
          <div className="queue-switch" role="group" aria-label="Dispatch queue">
            <button
              type="button"
              aria-pressed={queue === "orders"}
              onClick={() => setQueue("orders")}
            >
              Pending orders<span>{attention.data?.total ?? "—"}</span>
            </button>
            <button
              type="button"
              aria-pressed={queue === "deliveries"}
              onClick={() => setQueue("deliveries")}
            >
              Assign drivers<span>{unassigned.data?.total ?? "—"}</span>
            </button>
          </div>
          <div className="dispatch-list" aria-live="polite">
            {queue === "orders" ? (
              attention.isError ? (
                <ErrorState
                  description="Pending orders could not be loaded."
                  onRetry={() => attention.refetch()}
                />
              ) : attention.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : !attention.data?.items.length ? (
                <EmptyState
                  title="Orders are moving"
                  description="No pending orders need attention."
                />
              ) : (
                attention.data.items.slice(0, 3).map((order) => (
                  <Link
                    key={order.id}
                    to="/orders/$id"
                    params={{ id: order.id }}
                    className="dispatch-row"
                  >
                    <span className="customer-monogram" aria-hidden="true">
                      {order.customer.fullName
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p>{order.customer.fullName}</p>
                      <span>
                        {order.deliveryLocation.area} · {order.requestedDeliveryWindow}
                      </span>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                  </Link>
                ))
              )
            ) : unassigned.isError ? (
              <ErrorState
                description="Unassigned deliveries could not be loaded."
                onRetry={() => unassigned.refetch()}
              />
            ) : unassigned.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : !unassigned.data?.items.length ? (
              <EmptyState
                title="Every delivery has a driver"
                description="No unassigned deliveries in the queue."
              />
            ) : (
              unassigned.data.items.slice(0, 3).map((delivery) => (
                <div key={delivery.id} className="dispatch-row">
                  <span className="customer-monogram" aria-hidden="true">
                    <Truck className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>{delivery.customerName}</p>
                    <span>
                      {delivery.location.area} · {delivery.timeWindow}
                    </span>
                  </div>
                  <StatusBadge kind="delivery" status={delivery.status} />
                </div>
              ))
            )}
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to={queue === "orders" ? "/orders" : "/deliveries"}>
              {queue === "orders" ? "Open orders" : "Open driver assignments"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="dispatch-note">
            {queue === "orders"
              ? "Up to 3 pending orders shown."
              : "Up to 3 unassigned deliveries shown."}
          </p>
        </WorkPanel>
      </div>

      <div className="dashboard-secondary">
        <WorkPanel
          title="Recent orders"
          description="The latest customer requests."
          action={
            <Button asChild variant="ghost">
              <Link to="/orders">
                All orders
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          }
          className="recent-work-panel"
        >
          {recent.isError ? (
            <ErrorState
              description="Recent orders could not be loaded."
              onRetry={() => recent.refetch()}
            />
          ) : recent.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : !recent.data?.items.length ? (
            <EmptyState title="No orders yet" description="New customer orders will appear here." />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <caption className="sr-only">Six most recent customer water orders.</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Open order</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.data.items.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-semibold whitespace-nowrap">
                            {order.customer.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {order.deliveryLocation.area}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="whitespace-nowrap">
                            {productLabel(order.item.product, order.item.productName)}
                          </p>
                          <p className="text-sm text-muted-foreground">Qty {order.item.quantity}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold tabular-nums">
                          {formatTZS(order.total)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge kind="order" status={order.status} />
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="icon">
                            <Link
                              to="/orders/$id"
                              params={{ id: order.id }}
                              aria-label={`View order for ${order.customer.fullName}`}
                            >
                              <ArrowUpRight aria-hidden="true" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mobile-recent md:hidden">
                {recent.data.items.map((order) => (
                  <Link
                    className="mobile-order-row"
                    key={order.id}
                    to="/orders/$id"
                    params={{ id: order.id }}
                  >
                    <div className="min-w-0">
                      <p>{order.customer.fullName}</p>
                      <span>
                        {productLabel(order.item.product, order.item.productName)} ×{" "}
                        {order.item.quantity}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <strong>{formatTZS(order.total)}</strong>
                      <StatusBadge kind="order" status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </WorkPanel>
        <WorkPanel
          title="Team activity"
          description={
            isAdmin ? "Administrative and operational updates." : "Recent operational updates."
          }
        >
          {activity.isError ? (
            <ErrorState
              description="Activity could not be loaded."
              onRetry={() => activity.refetch()}
            />
          ) : activity.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : !activity.data?.length ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ol className="activity-list">
              {activity.data.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <span className="activity-mark" aria-hidden="true">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div>
                    <p>{event.title}</p>
                    <span>{event.description}</span>
                    <time>{formatRelative(event.at)}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {isAdmin && (
            <div className="system-summary">
              <span>System status</span>
              <strong>{metrics.isLoading ? "—" : (m?.systemStatus ?? "Not available")}</strong>
              <span>Sales managers</span>
              <strong>{n(m?.activeSalesManagers)}</strong>
            </div>
          )}
        </WorkPanel>
      </div>
      {!isAdmin && (
        <WorkPanel
          title="Available drivers"
          description="The team ready for the next assignment."
          action={
            <Button asChild variant="ghost">
              <Link to="/drivers">
                Manage drivers
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          }
        >
          {drivers.isError ? (
            <ErrorState
              description="Drivers could not be loaded."
              onRetry={() => drivers.refetch()}
            />
          ) : drivers.isLoading ? (
            <LoadingSkeleton variant="cards" rows={4} />
          ) : !drivers.data?.length ? (
            <EmptyState title="No drivers available" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {drivers.data.slice(0, 4).map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </WorkPanel>
      )}
    </div>
  );
}
