import { Check, Circle, XCircle } from "lucide-react";
import { ORDER_LIFECYCLE, ORDER_STATUS_LABELS, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

/** Order lifecycle timeline. Stages come from the shared lifecycle definition. */
export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <XCircle className="size-5 text-destructive" />
        <div>
          <p className="text-sm font-medium text-foreground">Order cancelled</p>
          <p className="text-xs text-muted-foreground">This order is no longer in progress.</p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_LIFECYCLE.indexOf(order.status);

  return (
    <ol className="space-y-0">
      {ORDER_LIFECYCLE.map((stage, index) => {
        const entry = order.timeline.find((t) => t.status === stage);
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border",
                  done
                    ? "border-success/30 bg-success/12 text-success"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
              </span>
              {index < ORDER_LIFECYCLE.length - 1 ? (
                <span
                  className={cn(
                    "w-px flex-1",
                    index < currentIndex ? "bg-success/40" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <div className="pb-5">
              <p
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold text-foreground" : "text-foreground/90",
                )}
              >
                {ORDER_STATUS_LABELS[stage]}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry?.at ? formatDateTime(entry.at) : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
