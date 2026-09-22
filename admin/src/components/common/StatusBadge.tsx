import { cn } from "@/lib/utils";
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/format";
import type { AccountStatus, DeliveryStatus, OrderStatus, PaymentStatus } from "@/types";

type Tone = "neutral" | "info" | "progress" | "success" | "warning" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/20",
  progress: "bg-brand-soft/25 text-accent-foreground border-brand-soft/40",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
};

const ORDER_TONES: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "info",
  processing: "progress",
  out_for_delivery: "progress",
  delivered: "success",
  customer_received: "success",
  cancelled: "danger",
};

const DELIVERY_TONES: Record<DeliveryStatus, Tone> = {
  unassigned: "warning",
  assigned: "info",
  out_for_delivery: "progress",
  delivered: "success",
  customer_received: "success",
  cancelled: "danger",
};

const PAYMENT_TONES: Record<PaymentStatus, Tone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "danger",
  refunded: "neutral",
};

function Pill({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge(
  props:
    | { kind: "order"; status: OrderStatus }
    | { kind: "delivery"; status: DeliveryStatus }
    | { kind: "payment"; status: PaymentStatus }
    | { kind: "account"; status: AccountStatus },
) {
  if (props.kind === "order") {
    return <Pill tone={ORDER_TONES[props.status]}>{ORDER_STATUS_LABELS[props.status]}</Pill>;
  }
  if (props.kind === "delivery") {
    return <Pill tone={DELIVERY_TONES[props.status]}>{DELIVERY_STATUS_LABELS[props.status]}</Pill>;
  }
  if (props.kind === "payment") {
    return <Pill tone={PAYMENT_TONES[props.status]}>{PAYMENT_STATUS_LABELS[props.status]}</Pill>;
  }
  return (
    <Pill tone={props.status === "active" ? "success" : "neutral"}>
      {props.status === "active" ? "Active" : "Inactive"}
    </Pill>
  );
}
