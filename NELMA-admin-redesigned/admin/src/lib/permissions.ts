import type { DashboardRole, OrderStatus } from "@/types";

/**
 * AUTHORITATIVE FRONTEND PERMISSION MAP (UX ONLY).
 *
 * The FastAPI backend is the authoritative authorization layer. These flags
 * exist so the dashboard never renders an action a role may not perform.
 * Undecided permissions are deliberately FALSE for both roles:
 *   - confirmCustomerReceipt (undecided for SALES_MANAGER)
 *   - updateDeliveryStatus  (undecided for SYSTEM_ADMIN)
 */
export type Permission =
  | "orders.view"
  | "orders.create"
  | "orders.process"
  | "payments.collectCash"
  | "orders.confirmCustomerReceipt"
  | "deliveries.view"
  | "deliveries.update"
  | "deliveries.assignDriver"
  | "drivers.view"
  | "drivers.manage"
  | "reports.view"
  | "pricing.manage"
  | "accounts.manage"
  | "settings.manage"
  | "audit.view"
  | "notifications.view"
  | "profile.view";

const SALES_MANAGER: Permission[] = [
  "orders.view",
  "orders.create",
  "orders.process",
  "payments.collectCash",
  "deliveries.view",
  "deliveries.update",
  "deliveries.assignDriver",
  "drivers.view",
  "drivers.manage",
  "reports.view",
  "pricing.manage",
  "notifications.view",
  "profile.view",
];

const SYSTEM_ADMIN: Permission[] = [
  "orders.view",
  "deliveries.view",
  "deliveries.assignDriver",
  "drivers.view",
  "drivers.manage",
  "reports.view",
  "pricing.manage",
  "accounts.manage",
  "settings.manage",
  "audit.view",
  "notifications.view",
  "profile.view",
];

export const ROLE_PERMISSIONS: Record<DashboardRole, Permission[]> = {
  SALES_MANAGER,
  SYSTEM_ADMIN,
};

export function can(role: DashboardRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<DashboardRole, string> = {
  SALES_MANAGER: "Sales Manager",
  SYSTEM_ADMIN: "System Admin",
};

/** Valid forward transitions the dashboard may request. No arbitrary jumps. */
export const ORDER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "processing",
};

export const TRANSITION_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: "Confirm Order",
  confirmed: "Start Processing",
};
