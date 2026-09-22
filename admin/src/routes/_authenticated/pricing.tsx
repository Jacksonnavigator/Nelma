import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { PriceEditModal } from "@/components/pricing/PriceEditModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { pricingService } from "@/services";
import { formatDateTime, formatTZS } from "@/lib/format";
import type { PriceConfiguration } from "@/types";

export const Route = createFileRoute("/_authenticated/pricing")({
  head: () => ({
    meta: [
      { title: "NELMA | Pricing" },
      {
        name: "description",
        content: "Set and review NELMA water product prices in Tanzanian Shillings.",
      },
      { property: "og:title", content: "NELMA | Pricing" },
      {
        property: "og:description",
        content: "Set and review NELMA water product prices in Tanzanian Shillings.",
      },
    ],
  }),
  component: () => (
    <PermissionGate permission="pricing.manage">
      <PricingPage />
    </PermissionGate>
  ),
});

function PricingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [target, setTarget] = useState<PriceConfiguration | null>(null);

  const prices = useQuery({ queryKey: ["pricing"], queryFn: () => pricingService.list() });

  const update = useMutation({
    mutationFn: (value: number) =>
      pricingService.update(target!.product, value, user?.fullName ?? "Dashboard user"),
    onSuccess: () => {
      toast.success("Price updated");
      setTarget(null);
      qc.invalidateQueries();
    },
    onError: () => toast.error("Could not update this price"),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pricing"
        description="Product prices used for new orders. The backend remains the source of truth for charged amounts."
      />

      {prices.isError ? (
        <ErrorState description="Pricing could not be loaded." onRetry={() => prices.refetch()} />
      ) : prices.isLoading ? (
        <LoadingSkeleton variant="cards" rows={2} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prices.data!.map((price) => (
            <div
              key={price.product}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <p className="text-sm font-semibold text-foreground">{price.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {formatTZS(price.price)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Last updated {price.updatedAt ? formatDateTime(price.updatedAt) : "Not available"}{" "}
                by {price.updatedBy}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => setTarget(price)}>
                Edit price
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Delivery charges are defined by the backend and are not editable from the dashboard.
      </p>

      <PriceEditModal
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        price={target}
        loading={update.isPending}
        onSave={(value) => update.mutate(value)}
      />
    </div>
  );
}
