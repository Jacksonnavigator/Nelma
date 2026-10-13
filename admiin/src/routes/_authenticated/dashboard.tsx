import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  PackageCheck,
  ServerCog,
  Truck,
  Users,
  Wallet,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { OrderCard } from "@/components/orders/OrderCard";
import { DriverCard } from "@/components/drivers/DriverCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DistributionChart, SalesTrendChart } from "@/components/sales/SalesChart";
import { ORDER_STATUS_COLORS } from "@/lib/chart-colors";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  ORDER_STATUS_LABELS,
  formatDate,
  formatNumber,
  formatRelative,
  formatTZS,
} from "@/lib/format";
import { deliveriesService, driversService, ordersService, salesService } from "@/services";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "NELMA | Dashboard" },
      {
        name: "description",
        content: "Daily orders, deliveries, drivers and sales overview for NELMA staff.",
      },
      { property: "og:title", content: "NELMA | Dashboard" },
      {
        property: "og:description",
        content: "Daily orders, deliveries, drivers and sales overview for NELMA staff.",
      },
    ],
  }),
  component: DashboardPage,
});

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-panel rounded-xl border border-border bg-card">
      <div className="dashboard-panel-header flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
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

  const metrics = useQuery({ queryKey: ["metrics"], queryFn: () => ordersService.metrics() });
  const activity = useQuery({
    queryKey: ["activity", role],
    queryFn: () => ordersService.activity(role),
  });
  const recentOrders = useQuery({
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
  const drivers = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: () => driversService.available(),
  });
  const report = useQuery({
    queryKey: ["sales", "week"],
    queryFn: () => salesService.report({ period: "week" }),
  });
  const statusCounts = useQuery({
    queryKey: ["orders", "status-counts"],
    queryFn: () => ordersService.statusCounts(),
  });

  if (metrics.isError) {
    return (
      <ErrorState
        description="The dashboard summary could not be loaded."
        onRetry={() => metrics.refetch()}
      />
    );
  }

  const m = metrics.data;
  const loading = metrics.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Operations overview" : "Your day, at a glance"}
        description={
          isAdmin
            ? "Keep orders moving, coordinate your team, and monitor the business."
            : "Today's water orders, deliveries and sales at a glance."
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/deliveries">
                Manage deliveries
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            {can("orders.create") && (
              <Button asChild>
                <Link to="/create-order">
                  <Plus className="size-4" />
                  Create order
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isAdmin ? "Total orders today" : "Today's orders"}
          value={formatNumber(m?.todayOrders ?? 0)}
          icon={ClipboardList}
          hint="Orders placed today"
          loading={loading}
        />
        <StatCard
          label={isAdmin ? "Sales today" : "Today's sales"}
          value={formatTZS(m?.todaySales ?? 0)}
          icon={Wallet}
          tone="green"
          hint="Sales recorded today"
          loading={loading}
        />
        <StatCard
          label="Active drivers"
          value={formatNumber(m?.activeDrivers ?? 0)}
          icon={Truck}
          tone="mint"
          hint="Active on the platform"
          loading={loading}
        />
        {isAdmin ? (
          <StatCard
            label="Active sales managers"
            value={formatNumber(m?.activeSalesManagers ?? 0)}
            icon={Users}
            loading={loading}
          />
        ) : (
          <StatCard
            label="Pending"
            value={formatNumber(m?.pendingOrders ?? 0)}
            icon={AlertTriangle}
            tone="warning"
            loading={loading}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isAdmin ? (
          <>
            <StatCard
              compact
              label="Pending deliveries"
              value={formatNumber(m?.pendingDeliveries ?? 0)}
              icon={Truck}
              tone="warning"
              loading={loading}
            />
            <StatCard
              compact
              label="Pending payments"
              value={formatNumber(m?.pendingPayments ?? 0)}
              icon={CreditCard}
              tone="warning"
              loading={loading}
            />
            <StatCard
              compact
              label="Completed today"
              value={formatNumber(m?.completedToday ?? 0)}
              icon={PackageCheck}
              tone="green"
              loading={loading}
            />
            <StatCard
              compact
              label="System status"
              value={m ? m.systemStatus.charAt(0).toUpperCase() + m.systemStatus.slice(1) : "—"}
              icon={ServerCog}
              tone={m?.systemStatus === "operational" ? "green" : "warning"}
              loading={loading}
            />
          </>
        ) : (
          <>
            <StatCard
              compact
              label="Processing"
              value={formatNumber(m?.processing ?? 0)}
              icon={PackageCheck}
              loading={loading}
            />
            <StatCard
              compact
              label="Out for delivery"
              value={formatNumber(m?.outForDelivery ?? 0)}
              icon={Truck}
              tone="mint"
              loading={loading}
            />
            <StatCard
              compact
              label="Completed today"
              value={formatNumber(m?.completedToday ?? 0)}
              icon={BadgeCheck}
              tone="green"
              loading={loading}
            />
            <StatCard
              compact
              label="Pending payments"
              value={formatNumber(m?.pendingPayments ?? 0)}
              icon={CreditCard}
              tone="warning"
              loading={loading}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {report.isError ? (
            <ErrorState
              description="Sales data could not be loaded."
              onRetry={() => report.refetch()}
            />
          ) : report.isLoading ? (
            <LoadingSkeleton variant="chart" />
          ) : (
            <SalesTrendChart
              title="Sales trend (this week)"
              data={(report.data?.trend ?? []).map((p) => ({
                date: formatDate(p.date).slice(0, 6),
                sales: p.sales,
              }))}
            />
          )}
        </div>
        {statusCounts.isError ? (
          <ErrorState
            description="Order status data could not be loaded."
            onRetry={() => statusCounts.refetch()}
          />
        ) : statusCounts.isLoading ? (
          <LoadingSkeleton variant="chart" />
        ) : (
          <DistributionChart
            title="Order status distribution"
            data={(statusCounts.data ?? []).map((s) => ({
              label: ORDER_STATUS_LABELS[s.status],
              count: s.count,
              color: ORDER_STATUS_COLORS[s.status],
            }))}
          />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Recent orders"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">View all</Link>
            </Button>
          }
        >
          {recentOrders.isError ? (
            <ErrorState
              description="Recent orders could not be loaded."
              onRetry={() => recentOrders.refetch()}
            />
          ) : recentOrders.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (recentOrders.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="No orders yet" description="New orders will appear here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentOrders.data!.items.map((order) => (
                <OrderCard key={order.id} order={order} compact />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={isAdmin ? "Orders awaiting action" : "Orders requiring attention"}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">Open orders</Link>
            </Button>
          }
        >
          {attention.isError ? (
            <ErrorState
              description="Orders awaiting action could not be loaded."
              onRetry={() => attention.refetch()}
            />
          ) : attention.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (attention.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="Nothing needs attention" description="All orders are moving." />
          ) : (
            <ul className="space-y-2">
              {attention.data!.items.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1 basis-[140px]">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.customer.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.requestedDeliveryDate)} · {order.requestedDeliveryWindow}
                    </p>
                  </div>
                  <StatusBadge kind="order" status={order.status} />
                  <Button asChild variant="outline" size="sm">
                    <Link to="/orders/$id" params={{ id: order.id }}>
                      View
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Deliveries needing assignment"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/deliveries">Assign</Link>
            </Button>
          }
        >
          {unassigned.isError ? (
            <ErrorState
              description="Unassigned deliveries could not be loaded."
              onRetry={() => unassigned.refetch()}
            />
          ) : unassigned.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (unassigned.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="All deliveries assigned" description="No unassigned deliveries." />
          ) : (
            <ul className="space-y-2">
              {unassigned.data!.items.map((delivery) => (
                <li
                  key={delivery.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1 basis-[140px]">
                    <p className="truncate text-sm font-medium text-foreground">
                      {delivery.customerName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {delivery.location.area} · {delivery.timeWindow}
                    </p>
                  </div>
                  <StatusBadge kind="delivery" status={delivery.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={isAdmin ? "Recent administrative activity" : "Recent operational activity"}>
          {activity.isError ? (
            <ErrorState
              description="Recent activity could not be loaded."
              onRetry={() => activity.refetch()}
            />
          ) : activity.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (activity.data?.length ?? 0) === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ul className="space-y-3">
              {activity.data!.map((event) => (
                <li key={event.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{formatRelative(event.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {!isAdmin ? (
        <Panel
          title="Active drivers"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/drivers">Manage drivers</Link>
            </Button>
          }
        >
          {drivers.isError ? (
            <ErrorState
              description="Active drivers could not be loaded."
              onRetry={() => drivers.refetch()}
            />
          ) : drivers.isLoading ? (
            <LoadingSkeleton variant="cards" rows={4} />
          ) : (drivers.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No active drivers"
              description="Activate a driver to start assigning."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {drivers.data!.slice(0, 4).map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
