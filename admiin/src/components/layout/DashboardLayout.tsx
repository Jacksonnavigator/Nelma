import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PUSH_STATUS_KEY } from "@/hooks/usePushAlerts";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PAGE_TITLES } from "@/lib/nav";
import { syncPush } from "@/lib/web-push";
import { useAuth } from "@/hooks/useAuth";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const userId = user?.id;

  // If this browser already allowed alerts, tell the server again so they belong to whoever is signed in now.
  useEffect(() => {
    // Refresh the on/off display afterwards: it may have been read before the browser was linked again.
    if (userId)
      void syncPush().then(() => queryClient.invalidateQueries({ queryKey: PUSH_STATUS_KEY }));
  }, [userId, queryClient]);

  if (!user) return null;

  const base = "/" + (pathname.split("/")[1] ?? "");
  let title = PAGE_TITLES[base] ?? "Dashboard";
  if (user.role === "SYSTEM_ADMIN" && base === "/dashboard") title = "Overview";
  if (user.role === "SYSTEM_ADMIN" && base === "/sales") title = "Sales Reports";

  return (
    <div className="flex min-h-dvh bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar
            role={user.role}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[248px] p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate your NELMA workspace. Use Close navigation at the bottom to dismiss.
          </SheetDescription>
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
        <main
          id="main-content"
          tabIndex={-1}
          className="portal-main mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
