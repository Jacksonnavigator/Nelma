import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterBar, FilterSelect } from "@/components/common/FilterBar";
import { DataPagination } from "@/components/common/DataPagination";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { DriverCard } from "@/components/drivers/DriverCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { driversService } from "@/services";
import { DATA_MODE, isApiError } from "@/services/api";
import type { Driver } from "@/types";

export const Route = createFileRoute("/_authenticated/drivers/")({
  head: () => ({
    meta: [
      { title: "NELMA | Drivers" },
      {
        name: "description",
        content: "Manage NELMA delivery drivers, their availability and delivery workload.",
      },
      { property: "og:title", content: "NELMA | Drivers" },
      {
        property: "og:description",
        content: "Manage NELMA delivery drivers, their availability and delivery workload.",
      },
    ],
  }),
  component: DriversPage,
});

const PAGE_SIZE = 9;

function DriversPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const query = { page, pageSize: PAGE_SIZE, status, ...(search ? { search } : {}) };
  const drivers = useQuery({
    queryKey: ["drivers", query],
    queryFn: () => driversService.list(query),
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: () =>
      driversService.create({
        fullName: fullName.trim(),
        phone: phone.trim(),
        ...(password ? { password } : {}),
      }),
    onSuccess: () => {
      toast.success("Driver added");
      setCreating(false);
      setFullName("");
      setPhone("");
      setPassword("");
      qc.invalidateQueries();
    },
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Could not add this driver"),
  });

  const toggle = useMutation({
    mutationFn: (driver: Driver) =>
      driversService.update(driver.id, {
        status: driver.status === "active" ? "inactive" : "active",
      }),
    onSuccess: () => {
      toast.success("Driver updated");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not update this driver"),
  });

  const valid =
    fullName.trim().length > 2 &&
    phone.trim().length >= 9 &&
    (DATA_MODE !== "api" || password.length >= 8);
  const filtersActive = search !== "" || status !== "all";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Drivers"
        description="Delivery team, current workload and availability."
        actions={
          can("drivers.manage") ? (
            <Button onClick={() => setCreating(true)}>Add driver</Button>
          ) : null
        }
      />

      <FilterBar
        onClear={() => {
          setSearch("");
          setStatus("all");
          setPage(1);
        }}
        showClear={filtersActive}
      >
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search name or phone"
          />
        </div>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All drivers" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FilterBar>

      {drivers.isError ? (
        <ErrorState description="Drivers could not be loaded." onRetry={() => drivers.refetch()} />
      ) : drivers.isLoading ? (
        <LoadingSkeleton variant="cards" rows={6} />
      ) : (drivers.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No drivers found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {drivers.data!.items.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                action={
                  can("drivers.manage") ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate(driver)}
                    >
                      {driver.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  ) : null
                }
              />
            ))}
          </div>
          <DataPagination
            page={drivers.data!.page}
            pageSize={drivers.data!.pageSize}
            total={drivers.data!.total}
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!create.isPending) {
            setCreating(open);
            if (!open) setPassword("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add driver</DialogTitle>
            <DialogDescription>
              Drivers receive delivery assignments from the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="driver-name">Full name</Label>
              <Input
                id="driver-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Juma Kileo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver-phone">Phone number</Label>
              <Input
                id="driver-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 7xx xxx xxx"
              />
            </div>
          </div>
          {DATA_MODE === "api" && (
            <div className="space-y-1.5">
              <Label htmlFor="driver-password">Initial password</Label>
              <Input
                id="driver-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button disabled={!valid || create.isPending} onClick={() => create.mutate()}>
              Add driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
