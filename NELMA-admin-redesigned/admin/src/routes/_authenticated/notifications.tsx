import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService } from "@/services";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "NELMA | Notifications" },
      {
        name: "description",
        content: "Operational alerts for NELMA orders, deliveries, payments and system events.",
      },
      { property: "og:title", content: "NELMA | Notifications" },
      {
        property: "og:description",
        content: "Operational alerts for NELMA orders, deliveries, payments and system events.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<"all" | "unread">("all");
  const role = user!.role;

  const notifications = useQuery({
    queryKey: ["notifications", role],
    queryFn: () => notificationsService.list(role),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries(),
    onError: () => toast.error("Could not update this notification"),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(role),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not update notifications"),
  });

  const items = (notifications.data ?? []).filter((n) => (view === "unread" ? !n.read : true));
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={
          unread > 0 ? `${unread} unread alert${unread === 1 ? "" : "s"}.` : "You are up to date."
        }
        actions={
          unread > 0 ? (
            <Button variant="outline" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
              Mark all as read
            </Button>
          ) : null
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {notifications.isError ? (
        <ErrorState
          description="Notifications could not be loaded."
          onRetry={() => notifications.refetch()}
        />
      ) : notifications.isLoading ? (
        <LoadingSkeleton variant="table" rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title={view === "unread" ? "No unread notifications" : "No notifications yet"}
          description="Alerts about orders, deliveries and payments will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              busy={markRead.isPending}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
