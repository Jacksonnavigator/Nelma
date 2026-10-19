import { BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushAlerts } from "@/hooks/usePushAlerts";
import { DATA_MODE } from "@/services/api";

/** The switch for browser alerts: a real notification on this device when an order or website request arrives. */
export function PushAlertsCard() {
  const { status, busy, enable, disable, sendTest } = usePushAlerts();

  // Nothing to offer on demo data or while checking, so the page stays uncluttered.
  if (status === "checking" || DATA_MODE !== "api") return null;

  const copy: Record<Exclude<typeof status, "checking">, { title: string; text: string }> = {
    on: {
      title: "Order alerts are on for this browser",
      text: "You will get a notification for new orders and website requests, even when the dashboard is closed.",
    },
    off: {
      title: "Get an alert when someone orders water",
      text: "Turn on notifications in this browser and you will hear about new orders straight away, even with the dashboard closed.",
    },
    blocked: {
      title: "Notifications are blocked in this browser",
      text: "Allow notifications for this site in your browser's site settings (the padlock next to the address), then reload this page.",
    },
    unavailable: {
      title: "Order alerts are not set up on the server yet",
      text: "An administrator needs to add the alert keys on the server before browsers can be switched on.",
    },
    unsupported: {
      title: "This browser cannot show order alerts",
      text: "Use Chrome, Edge, Firefox or Safari 16.4 or newer. On an iPhone, first add the dashboard to your Home Screen. The dashboard must also be opened over https.",
    },
  };
  const { title, text } = copy[status];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {status === "on" ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {status === "off" ? (
          <Button disabled={busy} onClick={() => void enable()}>
            Turn on alerts
          </Button>
        ) : null}
        {status === "on" ? (
          <>
            <Button variant="outline" disabled={busy} onClick={() => void sendTest()}>
              Send a test
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => void disable()}>
              Turn off
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
