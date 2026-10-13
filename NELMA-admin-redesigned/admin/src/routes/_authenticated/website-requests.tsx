import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PlusCircle,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { DataPagination } from "@/components/common/DataPagination";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { websiteRequestsService } from "@/services";
import type { WebsiteRequestQuery } from "@/services/contracts";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WebsiteRequest } from "@/types";

export const Route = createFileRoute("/_authenticated/website-requests")({
  head: () => ({ meta: [{ title: "NELMA | Website requests" }] }),
  component: () => (
    <PermissionGate permission="orders.view">
      <WebsiteRequestsPage />
    </PermissionGate>
  ),
});

const PAGE_SIZE = 20;

const TABS: { value: NonNullable<WebsiteRequestQuery["kind"]>; label: string }[] = [
  { value: "order", label: "Order requests" },
  { value: "contact", label: "Messages" },
  { value: "all", label: "Everything" },
];

function WebsiteRequestsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [kind, setKind] = useState<NonNullable<WebsiteRequestQuery["kind"]>>("order");
  const [status, setStatus] = useState<NonNullable<WebsiteRequestQuery["status"]>>("new");
  const [page, setPage] = useState(1);
  const query: WebsiteRequestQuery = { kind, status, page, pageSize: PAGE_SIZE };
  const list = useQuery({
    queryKey: ["website-requests", query],
    queryFn: () => websiteRequestsService.list(query),
    placeholderData: keepPreviousData,
  });
  const mark = useMutation({
    mutationFn: ({ id, next }: { id: string; next: WebsiteRequest["status"] }) =>
      websiteRequestsService.setStatus(id, next),
    onSuccess: (request) => {
      toast.success(request.status === "handled" ? "Marked as handled" : "Moved back to new");
      void qc.invalidateQueries({ queryKey: ["website-requests"] });
    },
    onError: () => toast.error("Could not update this request"),
  });
  const counts = list.data?.newCounts;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Website requests"
        description="Orders and messages sent from the NELMA website. Call the person back, then create the order and mark the request as handled."
      />

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const active = kind === tab.value;
          const fresh =
            tab.value === "all"
              ? (counts?.order ?? 0) + (counts?.contact ?? 0)
              : (counts?.[tab.value] ?? 0);
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setKind(tab.value);
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
              {fresh ? (
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-destructive text-white",
                  )}
                >
                  {fresh} new
                </span>
              ) : null}
            </button>
          );
        })}
        <div className="ml-auto flex gap-1 rounded-lg border bg-card p-1 text-sm">
          {(["new", "handled", "all"] as const).map((value) => (
            <button
              key={value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1 capitalize",
                status === value ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {list.isError ? (
        <ErrorState description="Requests could not be loaded." onRetry={() => list.refetch()} />
      ) : list.isLoading ? (
        <LoadingSkeleton />
      ) : !list.data?.items.length ? (
        <EmptyState
          title={status === "new" ? "Nothing waiting" : "No requests"}
          description="New orders and messages from the website will appear here."
        />
      ) : (
        <>
          <ul className="grid gap-3 lg:grid-cols-2">
            {list.data.items.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                canCreateOrder={can("orders.create")}
                busy={mark.isPending && mark.variables?.id === request.id}
                onToggle={() =>
                  mark.mutate({
                    id: request.id,
                    next: request.status === "new" ? "handled" : "new",
                  })
                }
              />
            ))}
          </ul>
          <DataPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={list.data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function RequestCard({
  request,
  canCreateOrder,
  busy,
  onToggle,
}: {
  request: WebsiteRequest;
  canCreateOrder: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const isOrder = request.kind === "order";
  const place = [request.address, request.area, request.city].filter(Boolean).join(", ");
  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-4 shadow-card",
        request.status === "new" ? "border-primary/40" : "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg",
            isOrder ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
          )}
        >
          {isOrder ? <ShoppingBag className="size-4" /> : <MessageSquare className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="font-semibold text-foreground">
              {request.name}
              {request.company ? (
                <span className="font-normal text-muted-foreground"> · {request.company}</span>
              ) : null}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(request.createdAt)}
            </span>
          </div>
          {isOrder ? (
            <p className="mt-1 text-sm text-foreground">
              <strong>
                {request.quantity} × {request.productName ?? request.productCode}
              </strong>
              <span className="text-muted-foreground">
                {" "}
                · {request.customerType === "existing" ? "Existing customer" : "New customer"}
              </span>
            </p>
          ) : null}
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {request.phone ? (
              <a
                className="flex items-center gap-2 hover:text-foreground"
                href={`tel:${request.phone}`}
              >
                <Phone className="size-3.5" /> {request.phone}
              </a>
            ) : null}
            {request.email ? (
              <a
                className="flex items-center gap-2 hover:text-foreground"
                href={`mailto:${request.email}`}
              >
                <Mail className="size-3.5" /> {request.email}
              </a>
            ) : null}
            {place ? (
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5" /> {place}
              </p>
            ) : null}
          </div>
          {request.message ? (
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
              {request.message}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {isOrder && request.status === "new" && canCreateOrder ? (
              <Button size="sm" variant="outline" asChild>
                <Link to="/create-order">
                  <PlusCircle className="mr-1.5 size-4" /> Create order
                </Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant={request.status === "new" ? "default" : "ghost"}
              disabled={busy}
              onClick={onToggle}
            >
              {request.status === "new" ? (
                <>
                  <CheckCircle2 className="mr-1.5 size-4" /> Mark handled
                </>
              ) : (
                <>
                  <RotateCcw className="mr-1.5 size-4" /> Move back to new
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
