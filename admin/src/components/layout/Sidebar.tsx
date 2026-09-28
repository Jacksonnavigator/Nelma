import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { navigationFor } from "@/lib/nav";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { DashboardRole } from "@/types";

/** Router-typed path cast: nav items are declared as strings in src/lib/nav.ts. */
type AppPath = "/dashboard";

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

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <img
          src="/brand/nelma-icon.png"
          alt="NELMA"
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-lg object-contain"
        />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              NELMA
            </p>
            <p className="truncate text-xs text-muted-foreground">Management Portal</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to as AppPath}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60",
            collapsed && "justify-center px-0",
          )}
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}
