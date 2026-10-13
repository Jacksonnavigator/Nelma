import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, Menu, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/common/RoleBadge";
import { NavigationSearch } from "./NavigationSearch";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { DATA_MODE, notificationsService } from "@/services";
import { initials } from "@/lib/format";

export function TopBar({ title, onOpenSidebar }: { title: string; onOpenSidebar: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.role],
    queryFn: () => notificationsService.list(user!.role),
    enabled: !!user,
  });
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-border bg-card px-4 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="hidden text-sm text-muted-foreground sm:block">
          {DATA_MODE === "mock" ? "NELMA demo workspace" : "NELMA workspace"}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
        <NavigationSearch />
        <ThemeToggle />
        <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Link to="/notifications">
            <Bell className="size-5" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(user.fullName)}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-medium text-foreground">
                  {user.fullName}
                </span>
                <RoleBadge role={user.role} />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm">{user.fullName}</span>
              <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserCircle className="mr-2 size-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="mr-2 size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
