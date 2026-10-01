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
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function DashboardPage() {
  const { user } = useAuth();
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
        title={isAdmin ? "Overview" : "Dashboard"}
        description={
          isAdmin
            ? "System-wide operational and administrative summary."
            : "Today's water orders, deliveries and sales at a glance."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isAdmin ? "Total orders today" : "Today's orders"}
          value={formatNumber(m?.todayOrders ?? 0)}
          icon={ClipboardList}
          loading={loading}
        />
        <StatCard
          label={isAdmin ? "Sales today" : "Today's sales"}
          value={formatTZS(m?.todaySales ?? 0)}
          icon={Wallet}
          tone="green"
          loading={loading}
        />
        <StatCard
          label="Active drivers"
          value={formatNumber(m?.activeDrivers ?? 0)}
          icon={Truck}
          tone="mint"
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
              label="Pending deliveries"
              value={formatNumber(m?.pendingDeliveries ?? 0)}
              icon={Truck}
              tone="warning"
              loading={loading}
            />
            <StatCard
              label="Pending payments"
              value={formatNumber(m?.pendingPayments ?? 0)}
              icon={CreditCard}
              tone="warning"
              loading={loading}
            />
            <StatCard
              label="Completed today"
              value={formatNumber(m?.completedToday ?? 0)}
              icon={PackageCheck}
              tone="green"
              loading={loading}
            />
            <StatCard
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
              label="Processing"
              value={formatNumber(m?.processing ?? 0)}
              icon={PackageCheck}
              loading={loading}
            />
            <StatCard
              label="Out for delivery"
              value={formatNumber(m?.outForDelivery ?? 0)}
              icon={Truck}
              tone="mint"
              loading={loading}
            />
            <StatCard
              label="Completed today"
              value={formatNumber(m?.completedToday ?? 0)}
              icon={BadgeCheck}
              tone="green"
              loading={loading}
            />
            <StatCard
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
          {report.isLoading ? (
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
        {statusCounts.isLoading ? (
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
          {recentOrders.isLoading ? (
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
          {attention.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (attention.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="Nothing needs attention" description="All orders are moving." />
          ) : (
            <ul className="space-y-2">
              {attention.data!.items.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.customer.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
          {unassigned.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (unassigned.data?.items.length ?? 0) === 0 ? (
            <EmptyState title="All deliveries assigned" description="No unassigned deliveries." />
          ) : (
            <ul className="space-y-2">
              {unassigned.data!.items.map((delivery) => (
                <li
                  key={delivery.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {delivery.customerName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
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
          {activity.isLoading ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (activity.data?.length ?? 0) === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ul className="space-y-3">
              {activity.data!.map((event) => (
                <li key={event.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(event.at)}</p>
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
          {drivers.isLoading ? (
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
