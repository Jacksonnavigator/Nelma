import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { ContactFields } from "@/components/common/ContactFields";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { RoleBadge } from "@/components/common/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { adminAccountsService } from "@/services";
import { DATA_MODE, isApiError } from "@/services/api";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import type { CreateAccountInput } from "@/services/contracts";
import type { AdminAccount, DashboardRole } from "@/types";

export const Route = createFileRoute("/_authenticated/admin-accounts")({
  head: () => ({ meta: [{ title: "NELMA | Admin Accounts" }] }),
  component: () => (
    <PermissionGate permission="accounts.manage">
      <AccountsPage />
    </PermissionGate>
  ),
});
const empty: CreateAccountInput = { fullName: "", email: "", phone: "", role: "SALES_MANAGER" };
function AccountsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: () => adminAccountsService.list() });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminAccount | "new" | null>(null);
  const [draft, setDraft] = useState<CreateAccountInput>(empty);
  const [password, setPassword] = useState("");
  const [target, setTarget] = useState<AdminAccount | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["accounts"] });
    void qc.invalidateQueries({ queryKey: ["audit"] });
    void qc.invalidateQueries({ queryKey: ["metrics"] });
  };
  const save = useMutation({
    mutationFn: () => {
      const input = {
        role: draft.role,
        fullName: draft.fullName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      };
      if (
        accounts.data?.some(
          (a) =>
            a.id !== (editing === "new" ? null : editing?.id) &&
            (a.email.toLowerCase() === input.email.toLowerCase() ||
              a.phone.replace(/\D/g, "") === input.phone.replace(/\D/g, "")),
        )
      )
        throw new Error("An account already uses this email or phone number.");
      return editing && editing !== "new"
        ? adminAccountsService.update(editing.id, input)
        : adminAccountsService.create({ ...input, ...(password ? { password } : {}) });
    },
    onSuccess: () => {
      refresh();
      setEditing(null);
      setPassword("");
      toast.success("Account saved");
    },
  });
  const toggle = useMutation({
    mutationFn: (account: AdminAccount) =>
      adminAccountsService.update(account.id, {
        status: account.status === "active" ? "inactive" : "active",
      }),
    onSuccess: () => {
      refresh();
      setTarget(null);
      toast.success("Account status updated");
    },
    onError: () => toast.error("Could not update account status. Please try again."),
  });
  const rows =
    accounts.data?.filter((a) =>
      `${a.fullName} ${a.email} ${a.phone} ${ROLE_LABELS[a.role]} ${a.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) ?? [];
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Accounts"
        description="Manage staff accounts and dashboard access."
        actions={
          <Button
            onClick={() => {
              setDraft(empty);
              setPassword("");
              save.reset();
              setEditing("new");
            }}
          >
            Add account
          </Button>
        }
      />
      <div className="max-w-md space-y-1.5">
        <Label htmlFor="account-search">Search accounts</Label>
        <Input
          id="account-search"
          placeholder="Search name, email, role or status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {accounts.isLoading ? (
        <LoadingSkeleton />
      ) : accounts.isError ? (
        <ErrorState
          description="Accounts could not be loaded."
          onRetry={() => accounts.refetch()}
        />
      ) : !rows.length ? (
        <EmptyState title="No accounts found" description="Try another search or add an account." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.fullName}
                    {a.id === user?.id ? " (you)" : ""}
                  </TableCell>
                  <TableCell>
                    <div>{a.email}</div>
                    <div className="text-muted-foreground">{a.phone}</div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={a.role} />
                  </TableCell>
                  <TableCell className="capitalize">{a.status}</TableCell>
                  <TableCell>{formatDate(a.createdAt)}</TableCell>
                  <TableCell>
                    {a.lastLoginAt
                      ? formatDate(a.lastLoginAt)
                      : DATA_MODE === "api"
                        ? "Not available"
                        : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={a.id === user?.id}
                        onClick={() => {
                          setDraft(a);
                          save.reset();
                          setEditing(a);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={a.id === user?.id || toggle.isPending}
                        onClick={() => setTarget(a)}
                      >
                        {a.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Use Profile to edit your own details. You cannot change your own role or deactivate your
        account here.
      </p>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open && !save.isPending) {
            setEditing(null);
            setPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add account" : "Edit account"}</DialogTitle>
            <DialogDescription>
              Set staff contact details and their dashboard role.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!save.isPending) save.mutate();
            }}
          >
            <fieldset disabled={save.isPending} className="space-y-4">
              <ContactFields value={draft} onChange={(value) => setDraft({ ...draft, ...value })} />
              {editing === "new" && DATA_MODE === "api" && (
                <div className="space-y-1.5">
                  <Label htmlFor="account-password">Initial password</Label>
                  <Input
                    id="account-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Share this password with the staff member through your approved secure channel.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="account-role">Role</Label>
                <select
                  id="account-role"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"

                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value as DashboardRole })}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {save.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {isApiError(save.error) || save.error instanceof Error
                    ? save.error.message
                    : "Could not save account. Please try again."}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setPassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button>{save.isPending ? "Saving..." : "Save account"}</Button>
              </div>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open && !toggle.isPending) setTarget(null);
        }}
        title={target?.status === "active" ? "Deactivate account?" : "Activate account?"}
        description={target ? `Change dashboard access for ${target.fullName}.` : ""}
        loading={toggle.isPending}
        onConfirm={() => {
          if (target) toggle.mutate(target);
        }}
      />
    </div>
  );
}
