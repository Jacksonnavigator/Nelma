import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { DataPagination } from "@/components/common/DataPagination";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { RoleBadge } from "@/components/common/RoleBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usersService } from "@/services";
import type { UserQuery } from "@/services/contracts";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountRole } from "@/types";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "NELMA | Users" }] }),
  component: () => (
    <PermissionGate permission="accounts.manage">
      <UsersPage />
    </PermissionGate>
  ),
});

const PAGE_SIZE = 25;

const ROLE_TABS: { value: NonNullable<UserQuery["role"]>; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "USER", label: "Customers" },
  { value: "DRIVER", label: "Drivers" },
  { value: "SALES_MANAGER", label: "Sales managers" },
  { value: "SYSTEM_ADMIN", label: "Admins" },
];

function UsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<NonNullable<UserQuery["role"]>>("all");
  const [status, setStatus] = useState<NonNullable<UserQuery["status"]>>("all");
  const [search, setSearch] = useState("");

  const query: UserQuery = { page, pageSize: PAGE_SIZE, role, status, search };
  const users = useQuery({
    queryKey: ["users", query],
    queryFn: () => usersService.list(query),
    placeholderData: keepPreviousData,
  });
  const counts = users.data?.roleCounts ?? {};
  const everyone = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Every account: customers from the app, drivers and dashboard staff."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by role">
        {ROLE_TABS.map((tab) => {
          const count = tab.value === "all" ? everyone : (counts[tab.value as AccountRole] ?? 0);
          const active = role === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setRole(tab.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  active ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {users.data ? count : "·"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, phone or email"
        />
        <FilterBar onClear={() => setStatus("all")} showClear={status !== "all"}>
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v as NonNullable<UserQuery["status"]>);
              setPage(1);
            }}
            options={[
              { value: "all", label: "Active and inactive" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </FilterBar>
      </div>

      {users.isError ? (
        <ErrorState description="Users could not be loaded." onRetry={() => users.refetch()} />
      ) : users.isLoading ? (
        <LoadingSkeleton />
      ) : !users.data?.items.length ? (
        <EmptyState title="No users found" description="Try another search or role." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell>
                      <div className="tabular-nums">{u.phone}</div>
                      {u.email ? <div className="text-muted-foreground">{u.email}</div> : null}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.role === "USER" ? u.orderCount : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-sm",
                          u.isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            u.isActive ? "bg-brand-green" : "bg-muted-foreground/50",
                          )}
                        />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={users.data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
