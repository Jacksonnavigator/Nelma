import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productsService } from "@/services";
import { isApiError } from "@/services/api";
import { formatTZS } from "@/lib/format";
import type { DeliveryFees, DeliveryZone } from "@/types";

const zoneId = (name: string, taken: string[]) => {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30) || "zone";
  let id = base.length >= 2 ? base : `zone_${base}`;
  for (let n = 2; taken.includes(id); n += 1) id = `${base}_${n}`;
  return id;
};

const money = (value: string) => Math.max(0, Math.round(Number(value) || 0));

const clean = (fees: DeliveryFees): DeliveryFees => ({
  defaultZoneName: fees.defaultZoneName.trim(),
  defaultFee: fees.defaultFee,
  zones: fees.zones.map((zone) => ({
    ...zone,
    name: zone.name.trim(),
    keywords: zone.keywords.map((k) => k.trim()).filter(Boolean),
  })),
});

/**
 * Delivery fees, edited next to product prices so sales managers can change them as well as admins.
 * A zone applies when one of its place names appears in the customer's address; everywhere else pays
 * the standard fee. The app and the website show the new fees on their next refresh.
 */
export function DeliveryFeesCard() {
  const qc = useQueryClient();
  const fees = useQuery({
    queryKey: ["delivery-fees"],
    queryFn: () => productsService.deliveryFees(),
  });
  const [draft, setDraft] = useState<DeliveryFees | null>(null);
  const save = useMutation({
    mutationFn: (value: DeliveryFees) => productsService.saveDeliveryFees(clean(value)),
    onSuccess: (value) => {
      qc.setQueryData(["delivery-fees"], value);
      void qc.invalidateQueries({ queryKey: ["settings"] });
      setDraft(null);
      toast.success("Delivery fees saved");
    },
  });

  if (fees.isLoading) return <LoadingSkeleton variant="detail" />;
  if (fees.isError || !fees.data)
    return (
      <ErrorState description="Delivery fees could not be loaded." onRetry={() => fees.refetch()} />
    );

  const value = draft ?? fees.data;
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(fees.data);
  const allFree = value.defaultFee === 0 && value.zones.every((zone) => zone.fee === 0);
  const setZone = (index: number, zone: DeliveryZone) =>
    setDraft({ ...value, zones: value.zones.map((z, i) => (i === index ? zone : z)) });

  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Truck className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Delivery fees</h2>
            <p className="text-sm text-muted-foreground">
              Added to each order on top of the product price.{" "}
              {allFree ? (
                <strong className="text-foreground">Delivery is currently free everywhere.</strong>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty && !save.isPending) save.mutate(value);
        }}
      >
        <fieldset disabled={save.isPending} className="space-y-3">
          <div className="grid gap-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="default-zone">Standard area name</Label>
              <Input
                id="default-zone"
                required
                minLength={2}
                value={value.defaultZoneName}
                onChange={(e) => setDraft({ ...value, defaultZoneName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default-fee">Standard fee (TZS)</Label>
              <Input
                id="default-fee"
                type="number"
                min={0}
                step={100}
                required
                value={value.defaultFee}
                onChange={(e) => setDraft({ ...value, defaultFee: money(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Charged everywhere not listed below. {formatTZS(value.defaultFee)}
                {value.defaultFee === 0 ? " (free)" : ""}
              </p>
            </div>
          </div>

          {value.zones.length ? (
            <p className="pt-1 text-xs text-muted-foreground">
              Places with their own fee. Use specific place names (such as "Tengeru"), not general
              words like "hostel".
            </p>
          ) : null}
          {value.zones.map((zone, index) => (
            <div
              key={zone.id}
              className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_140px_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`zone-name-${zone.id}`}>Area name</Label>
                <Input
                  id={`zone-name-${zone.id}`}
                  required
                  minLength={2}
                  value={zone.name}
                  onChange={(e) => setZone(index, { ...zone, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`zone-fee-${zone.id}`}>Fee (TZS)</Label>
                <Input
                  id={`zone-fee-${zone.id}`}
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={zone.fee}
                  onChange={(e) => setZone(index, { ...zone, fee: money(e.target.value) })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${zone.name || "area"}`}
                  onClick={() =>
                    setDraft({ ...value, zones: value.zones.filter((_, i) => i !== index) })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor={`zone-keywords-${zone.id}`}>
                  Place names in the address (comma separated)
                </Label>
                <Input
                  id={`zone-keywords-${zone.id}`}
                  required
                  value={zone.keywords.join(", ")}
                  onChange={(e) =>
                    setZone(index, {
                      ...zone,
                      keywords: e.target.value.split(",").map((k) => k.trimStart()),
                    })
                  }
                />
              </div>
            </div>
          ))}

          {save.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {isApiError(save.error)
                ? save.error.message
                : "Could not save the fees. Please try again."}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={value.zones.length >= 20}
              onClick={() =>
                setDraft({
                  ...value,
                  zones: [
                    ...value.zones,
                    {
                      id: zoneId(
                        `zone ${value.zones.length + 1}`,
                        value.zones.map((z) => z.id),
                      ),
                      name: "",
                      fee: 0,
                      keywords: [],
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 size-4" /> Add area with its own fee
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!dirty}
                onClick={() => {
                  setDraft(null);
                  save.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!dirty || save.isPending}>
                {save.isPending ? "Saving…" : "Save delivery fees"}
              </Button>
            </div>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
