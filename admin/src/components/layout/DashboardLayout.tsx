import { useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PAGE_TITLES } from "@/lib/nav";
import { useAuth } from "@/hooks/useAuth";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;

  const base = "/" + (pathname.split("/")[1] ?? "");
  let title = PAGE_TITLES[base] ?? "Dashboard";
  if (user.role === "SYSTEM_ADMIN" && base === "/dashboard") title = "Overview";
  if (user.role === "SYSTEM_ADMIN" && base === "/sales") title = "Sales Reports";

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar
            role={user.role}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            role={user.role}
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 space-y-6 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
