import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  PlusCircle,
  Settings,
  ShieldCheck,
  Tag,
  Truck,
  UserCircle,
  Users,
} from "lucide-react";
import type { DashboardRole } from "@/types";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
  /** Restrict an item to a single role even when both roles hold the permission. */
  roles?: DashboardRole[];
}

const SALES_MANAGER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permission: "orders.view" },
  { label: "Orders", to: "/orders", icon: ClipboardList, permission: "orders.view" },
  { label: "Create Order", to: "/create-order", icon: PlusCircle, permission: "orders.create" },
  { label: "Deliveries", to: "/deliveries", icon: Truck, permission: "deliveries.view" },
  { label: "Operations", to: "/operations", icon: Activity, permission: "deliveries.view" },
  { label: "Drivers", to: "/drivers", icon: Users, permission: "drivers.view" },
  { label: "Sales", to: "/sales", icon: BarChart3, permission: "reports.view" },
  { label: "Pricing", to: "/pricing", icon: Tag, permission: "pricing.manage" },
  { label: "Notifications", to: "/notifications", icon: Bell, permission: "notifications.view" },
  { label: "Profile", to: "/profile", icon: UserCircle, permission: "profile.view" },
];

const SYSTEM_ADMIN_NAV: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, permission: "orders.view" },
  { label: "Orders", to: "/orders", icon: ClipboardList, permission: "orders.view" },
  { label: "Deliveries", to: "/deliveries", icon: Truck, permission: "deliveries.view" },
  { label: "Operations", to: "/operations", icon: Activity, permission: "deliveries.view" },
  { label: "Drivers", to: "/drivers", icon: Users, permission: "drivers.view" },
  { label: "Sales Reports", to: "/sales", icon: BarChart3, permission: "reports.view" },
  { label: "Pricing", to: "/pricing", icon: Tag, permission: "pricing.manage" },
  {
    label: "Admin Accounts",
    to: "/admin-accounts",
    icon: ShieldCheck,
    permission: "accounts.manage",
  },
  {
    label: "System Settings",
    to: "/system-settings",
    icon: Settings,
    permission: "settings.manage",
  },
  { label: "Audit Logs", to: "/audit-logs", icon: FileClock, permission: "audit.view" },
  { label: "Notifications", to: "/notifications", icon: Bell, permission: "notifications.view" },
  { label: "Profile", to: "/profile", icon: UserCircle, permission: "profile.view" },
];

export function navigationFor(role: DashboardRole): NavItem[] {
  return role === "SYSTEM_ADMIN" ? SYSTEM_ADMIN_NAV : SALES_MANAGER_NAV;
}

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/create-order": "Create Order",
  "/deliveries": "Deliveries",
  "/operations": "Operations",
  "/drivers": "Drivers",
  "/sales": "Sales",
  "/pricing": "Pricing",
  "/admin-accounts": "Admin Accounts",
  "/system-settings": "System Settings",
  "/audit-logs": "Audit Logs",
  "/notifications": "Notifications",
  "/profile": "Profile",
};
