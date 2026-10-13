import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { navigationFor } from "@/lib/nav";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { DashboardRole } from "@/types";

type AppPath = "/dashboard";
const groupFor = (path: string) => {
  if (["/users", "/admin-accounts", "/system-settings", "/audit-logs"].includes(path))
    return "Administration";
  if (["/notifications", "/profile"].includes(path)) return "Workspace";
  if (["/sales", "/products"].includes(path)) return "Business";
  return "Operations";
};

export function Sidebar({
  role,
  collapsed,
  onToggle,
  onNavigate,
}: {
  role: DashboardRole;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const items = navigationFor(role).filter((item) => can(role, item.permission));
  const groups = ["Operations", "Business", "Administration", "Workspace"];
  return (
    <aside
      className={cn(
        "portal-sidebar flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[80px]" : "w-[248px]",
      )}
    >
      <Link
        to="/dashboard"
        onClick={onNavigate}
        aria-label="NELMA dashboard"
        className="flex h-20 shrink-0 items-center gap-3 px-5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
          <img src="/brand/nelma-icon.png" alt="" className="size-8 object-contain" />
        </span>
        {!collapsed && (
          <div>
            <p className="text-lg font-bold tracking-[.12em] text-foreground">NELMA</p>
            <p className="text-xs text-muted-foreground">Management portal</p>
          </div>
        )}
      </Link>
      {!collapsed && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-sidebar-border bg-background px-3 py-3">
          <Droplets className="size-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Water operations</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]} workspace</p>
          </div>
        </div>
      )}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((group) => {
          const members = items.filter((item) => groupFor(item.to) === group);
          if (!members.length) return null;
          return (
            <div key={group} className="mb-3">
              {!collapsed ? (
                <p className="px-3 pb-2 pt-3 text-xs font-semibold tracking-[.08em] text-muted-foreground">
                  {group.toUpperCase()}
                </p>
              ) : (
                <div className="my-3 border-t border-sidebar-border" />
              )}
              <div className="space-y-1">
                {members.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to as AppPath}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    activeProps={{
                      className:
                        "nav-active bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                      "aria-current": "page",
                    }}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        <ChevronRight className="nav-indicator ml-auto size-3.5" />
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            onNavigate ? "Close navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          className={cn(
            "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
          )}
        >
          <ChevronLeft className={cn("size-4", collapsed && "rotate-180")} />
          {!collapsed && <span>{onNavigate ? "Close navigation" : "Collapse sidebar"}</span>}
        </button>
      </div>
    </aside>
  );
}
