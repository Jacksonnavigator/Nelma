import { Bell, CreditCard, PackageCheck, Settings, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import type { AppNotification, NotificationKind } from "@/types";

const ICONS: Record<NotificationKind, typeof Bell> = {
  order: PackageCheck,
  delivery: Truck,
  payment: CreditCard,
  driver: Truck,
  system: Settings,
};

export function NotificationItem({
  notification,
  onMarkRead,
  busy,
}: {
  notification: AppNotification;
  onMarkRead?: (id: string) => void;
  busy?: boolean;
}) {
  const Icon = ICONS[notification.kind] ?? Bell;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-card",
        notification.read ? "border-border bg-card" : "border-primary/25 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{notification.title}</p>
          {!notification.read ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
              New
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelative(notification.createdAt)}
        </p>
      </div>
      {!notification.read && onMarkRead ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onMarkRead(notification.id)}
        >
          Mark read
        </Button>
      ) : null}
    </div>
  );
}
