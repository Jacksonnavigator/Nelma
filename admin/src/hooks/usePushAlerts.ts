import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  disablePush,
  enablePush,
  getPushStatus,
  sendTestAlert,
  type PushStatus,
} from "@/lib/web-push";

export const PUSH_STATUS_KEY = ["push-status"];
const STATUS_KEY = PUSH_STATUS_KEY;

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : fallback;

/**
 * State and actions for the "order alerts on this browser" switch. The top bar and the Notifications page both use
 * it and share one cached status, so turning alerts on in one place updates the other straight away.
 */
export function usePushAlerts() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: STATUS_KEY,
    queryFn: getPushStatus,
    staleTime: 30_000,
    retry: false,
  });
  // If the server could not be asked, say nothing rather than show a wrong message.
  const status: PushStatus = query.data ?? "checking";

  const run = useCallback(
    async (action: () => Promise<void>, success: string, failure: string) => {
      setBusy(true);
      try {
        await action();
        toast.success(success);
      } catch (error) {
        toast.error(messageOf(error, failure));
      } finally {
        setBusy(false);
        await queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      }
    },
    [queryClient],
  );

  return {
    status,
    busy,
    enable: () =>
      run(enablePush, "Order alerts are on for this browser.", "Could not turn on alerts."),
    disable: () =>
      run(disablePush, "Order alerts are off for this browser.", "Could not turn off alerts."),
    sendTest: () =>
      run(
        sendTestAlert,
        "Test alert sent. It should appear in a moment.",
        "Could not send the test alert.",
      ),
  };
}
