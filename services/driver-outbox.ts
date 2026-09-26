import { repositories } from "../repositories";
import { localStore } from "../storage/local-store";
import type { DriverDeliveryHandover, Order } from "../types/order";
import { isConnectionError } from "../utils/driver-deliveries";

// Driver actions taken without signal are kept on the phone and sent in order once NELMA is reachable.
// Only idempotent actions are queued (accept, start, deliver), so a replay after a lost reply is harmless.

export type OutboxAction = "accept" | "out_for_delivery" | "delivered";

export type OutboxEntry = {
  id: string;
  orderId: string;
  orderNumber?: string;
  action: OutboxAction;
  handover?: DriverDeliveryHandover;
  queuedAt: string;
};

export type OutboxFailure = { orderId: string; orderNumber?: string; action: OutboxAction; message: string };

export type FlushResult = { synced: Order[]; failures: OutboxFailure[]; offline: boolean };

type Listener = () => void;

let owner = "anon";
let entries: OutboxEntry[] = [];
let failures: OutboxFailure[] = [];
let loadedFor: string | null = null;
let flushing: Promise<FlushResult> | null = null;
const listeners = new Set<Listener>();

const queueKey = () => "nelma.driver.outbox." + owner;
const routeKey = () => "nelma.driver.route." + owner;
const emit = () => listeners.forEach((listener) => listener());

const load = async (): Promise<void> => {
  if (loadedFor === owner) return;
  const current = owner;
  const stored = await localStore.getJson<OutboxEntry[]>(queueKey()).catch(() => null);
  if (current !== owner) return;
  entries = Array.isArray(stored) ? stored : [];
  loadedFor = owner;
  emit();
};

const persist = async (): Promise<void> => {
  await localStore.setJson(queueKey(), entries).catch(() => undefined);
  emit();
};

const send = (entry: OutboxEntry): Promise<Order> => {
  if (entry.action === "accept") return repositories.driver.accept(entry.orderId);
  return entry.handover
    ? repositories.driver.updateStatus(entry.orderId, entry.action, entry.handover)
    : repositories.driver.updateStatus(entry.orderId, entry.action);
};

const messageOf = (error: unknown): string => {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : "NELMA did not accept this update.";
};

/** Shows the order as the driver left it on this phone, including updates still waiting to be sent. */
export const applyPending = (order: Order, pending: OutboxEntry[] = entries): Order => {
  return pending
    .filter((entry) => entry.orderId === order.id)
    .reduce<Order>((current, entry) => {
      if (entry.action === "accept") return { ...current, driverAcceptedAt: current.driverAcceptedAt ?? entry.queuedAt };
      return { ...current, status: entry.action, driverAcceptedAt: current.driverAcceptedAt ?? entry.queuedAt };
    }, order);
};

export const driverOutbox = {
  /** Scope the queue to the signed-in driver so a shared phone never replays another account's actions. */
  setOwner(userId: string | undefined): void {
    const next = userId || "anon";
    if (next === owner) return;
    owner = next;
    entries = [];
    failures = [];
    loadedFor = null;
    emit();
    void load();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  snapshot(): { pending: OutboxEntry[]; failures: OutboxFailure[] } {
    return { pending: entries, failures };
  },

  async enqueue(order: Order, action: OutboxAction, handover?: DriverDeliveryHandover): Promise<void> {
    await load();
    const entry: OutboxEntry = {
      id: order.id + ":" + action,
      orderId: order.id,
      orderNumber: order.orderNumber,
      action,
      ...(handover ? { handover } : {}),
      queuedAt: new Date().toISOString()
    };
    // A second tap on the same step replaces the first; the order of different steps is kept.
    entries = [...entries.filter((item) => item.id !== entry.id), entry];
    await persist();
  },

  async clear(): Promise<void> {
    entries = [];
    failures = [];
    await persist();
  },

  dismissFailures(): void {
    failures = [];
    emit();
  },

  /** Sends queued actions oldest first. Stops at the first connection error and keeps the rest. */
  flush(): Promise<FlushResult> {
    if (flushing) return flushing;
    flushing = (async (): Promise<FlushResult> => {
      await load();
      const synced: Order[] = [];
      const failed: OutboxFailure[] = [];
      let offline = false;
      for (const entry of [...entries]) {
        try {
          synced.push(await send(entry));
        } catch (error) {
          if (isConnectionError(error)) {
            offline = true;
            break;
          }
          // Rejected for good (wrong code, reassigned, cancelled): drop it and tell the driver.
          failed.push({ orderId: entry.orderId, orderNumber: entry.orderNumber, action: entry.action, message: messageOf(error) });
        }
        entries = entries.filter((item) => item.id !== entry.id);
        await persist();
      }
      if (failed.length) {
        failures = [...failures, ...failed];
        emit();
      }
      return { synced, failures: failed, offline };
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  },

  async saveRoute(orders: Order[]): Promise<void> {
    await localStore.setJson(routeKey(), orders).catch(() => undefined);
  },

  async savedRoute(): Promise<Order[] | null> {
    const stored = await localStore.getJson<Order[]>(routeKey()).catch(() => null);
    return Array.isArray(stored) ? stored : null;
  },

  async savedOrder(id: string): Promise<Order | null> {
    return (await this.savedRoute())?.find((order) => order.id === id) ?? null;
  }
};
