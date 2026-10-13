import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Permission } from "@/lib/permissions";

/**
 * Route-level access gate. Permission truth lives in src/lib/permissions.ts;
 * screens never re-declare role rules.
 */
export function PermissionGate({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { can } = useAuth();
  if (can(permission)) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center shadow-card">
      <span className="flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning">
        <ShieldAlert className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Access denied</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Your role does not have permission to view this page. If you believe this is a mistake,
        contact a System Admin.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
