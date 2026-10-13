import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { FilterBar, FilterDate } from "@/components/common/FilterBar";
import { SearchInput } from "@/components/common/SearchInput";
import { DataPagination } from "@/components/common/DataPagination";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { Label } from "@/components/ui/label";
import { auditService } from "@/services";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({
    meta: [
      { title: "NELMA | Audit Logs" },
      {
        name: "description",
        content: "Read-only record of administrative and operational actions in the NELMA portal.",
      },
      { property: "og:title", content: "NELMA | Audit Logs" },
      {
        property: "og:description",
        content: "Read-only record of administrative and operational actions in the NELMA portal.",
      },
    ],
  }),
  component: () => (
    <PermissionGate permission="audit.view">
      <AuditLogsPage />
    </PermissionGate>
  ),
});

const PAGE_SIZE = 12;

function AuditLogsPage() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const query = {
    page,
    pageSize: PAGE_SIZE,
    ...(actor ? { actor } : {}),
    ...(action ? { action } : {}),
    ...(date ? { date } : {}),
  };
  const events = useQuery({
    queryKey: ["audit", query],
    queryFn: () => auditService.list(query),
    placeholderData: keepPreviousData,
  });

  const filtersActive = actor !== "" || action !== "" || date !== "";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Logs"
        description="Every recorded action, in order. Entries cannot be edited or deleted."
      />

      <FilterBar
        onClear={() => {
          setActor("");
          setAction("");
          setDate("");
          setPage(1);
        }}
        showClear={filtersActive}
      >
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Actor</Label>
          <SearchInput
            value={actor}
            onChange={(v) => {
              setActor(v);
              setPage(1);
            }}
            placeholder="Search staff name"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Action</Label>
          <SearchInput
            value={action}
            onChange={(v) => {
              setAction(v);
              setPage(1);
            }}
            placeholder="Search action or entity"
          />
        </div>
        <FilterDate
          label="Date"
          value={date}
          onChange={(v) => {
            setDate(v);
            setPage(1);
          }}
        />
      </FilterBar>

      {events.isError ? (
        <ErrorState
          description="Audit logs could not be loaded."
          onRetry={() => events.refetch()}
        />
      ) : events.isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : (events.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No audit entries" description="Nothing matches these filters." />
      ) : (
        <>
          <AuditLogTable events={events.data!.items} />
          <DataPagination
            page={events.data!.page}
            pageSize={events.data!.pageSize}
            total={events.data!.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
