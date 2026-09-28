import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { settingsService } from "@/services";
import { isApiError } from "@/services/api";
import type { DeliveryZone, SystemSettings } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/system-settings")({
  head: () => ({ meta: [{ title: "NELMA | System Settings" }] }),
  component: () => (
    <PermissionGate permission="settings.manage">
      <SettingsPage />
    </PermissionGate>
  ),
});
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

// Places with their own delivery fee. The app picks the first zone whose place name appears in
// the customer's address; everything else pays the standard fee.
function DeliveryZonesEditor({
  delivery,
  onChange,
}: {
  delivery: SystemSettings["delivery"];
  onChange: (delivery: SystemSettings["delivery"]) => void;
}) {
  const zones = delivery.zones;
  const setZone = (index: number, zone: DeliveryZone) =>
    onChange({ ...delivery, zones: zones.map((z, i) => (i === index ? zone : z)) });
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Delivery fees</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A zone applies when one of its place names appears in the customer's address. Use specific
          names (such as "Tengeru"), not general words like "hostel".
        </p>
      </div>
      {zones.map((zone, index) => (
        <div
          key={zone.id}
          className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_120px_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`zone-name-${zone.id}`}>Zone name</Label>
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
              required
              value={zone.fee}
              onChange={(e) =>
                setZone(index, { ...zone, fee: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${zone.name}`}
              onClick={() => onChange({ ...delivery, zones: zones.filter((_, i) => i !== index) })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor={`zone-keywords-${zone.id}`}>Place names (comma separated)</Label>
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={zones.length >= 20}
        onClick={() =>
          onChange({
            ...delivery,
            zones: [
              ...zones,
              {
                id: zoneId(
                  `zone ${zones.length + 1}`,
                  zones.map((z) => z.id),
                ),
                name: "",
                fee: 0,
                keywords: [],
              },
            ],
          })
        }
      >
        <Plus className="mr-2 size-4" /> Add zone
      </Button>
      <div className="grid gap-3 rounded-lg bg-muted/50 p-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="default-zone">Everywhere else is called</Label>
          <Input
            id="default-zone"
            required
            minLength={2}
            value={delivery.defaultZoneName}
            onChange={(e) => onChange({ ...delivery, defaultZoneName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="default-fee">Standard fee (TZS)</Label>
          <Input
            id="default-fee"
            type="number"
            min={0}
            required
            value={delivery.defaultFee}
            onChange={(e) =>
              onChange({ ...delivery, defaultFee: Math.max(0, Number(e.target.value) || 0) })
            }
          />
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => settingsService.get() });
  const [draft, setDraft] = useState<SystemSettings | null>(null);
  const save = useMutation({
    mutationFn: (value: SystemSettings) => settingsService.update(value),
    onSuccess: (value) => {
      qc.setQueryData(["settings"], value);
      void qc.invalidateQueries({ queryKey: ["order-options"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
      setDraft(null);
      toast.success("Settings saved");
    },
  });
  const value = draft ?? settings.data;
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(settings.data);
  return (
    <div className="space-y-5">
      <PageHeader
        title="System Settings"
        description="Business details, payments, alerts and delivery preferences."
      />
      {settings.isLoading ? (
        <LoadingSkeleton variant="detail" />
      ) : settings.isError ? (
        <ErrorState
          description="Settings could not be loaded."
          onRetry={() => settings.refetch()}
        />
      ) : value ? (
        <form
          className="max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty && !save.isPending)
              save.mutate({
                ...value,
                business: {
                  name: value.business.name.trim(),
                  supportPhone: value.business.supportPhone.trim(),
                  supportEmail: value.business.supportEmail.trim(),
                  address: value.business.address.trim(),
                  operatingHours: value.business.operatingHours.trim(),
                },
                delivery: {
                  ...value.delivery,
                  defaultTimeWindows: [
                    ...new Set(
                      value.delivery.defaultTimeWindows.map((w) => w.trim()).filter(Boolean),
                    ),
                  ],
                  defaultZoneName: value.delivery.defaultZoneName.trim(),
                  zones: value.delivery.zones.map((zone) => ({
                    ...zone,
                    name: zone.name.trim(),
                    keywords: zone.keywords.map((k) => k.trim()).filter(Boolean),
                  })),
                },
              });
          }}
        >
          <fieldset disabled={save.isPending} className="space-y-5">
            <section className="rounded-xl border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-semibold">Business information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["name", "Business name", "text"],
                    ["supportPhone", "Support phone", "tel"],
                    ["supportEmail", "Support email", "email"],
                    ["address", "Address", "text"],
                    ["operatingHours", "Operating hours", "text"],
                  ] as const
                ).map(([key, label, type]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      required
                      type={type}
                      pattern={type === "text" ? ".*\\S.*" : undefined}
                      value={value.business[key]}
                      onChange={(e) =>
                        setDraft({
                          ...value,
                          business: { ...value.business, [key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-semibold">Payment methods</h2>
              <div className="space-y-4">
                {(
                  [
                    ["cashEnabled", "Cash on delivery"],
                    ["mobileMoneyEnabled", "Mobile money (not connected yet)"],
                  ] as const
                ).map(([key, label]) => (
                  <div className="flex items-center justify-between" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      disabled
                      checked={value.payments[key]}
                      onCheckedChange={(checked) =>
                        setDraft({ ...value, payments: { ...value.payments, [key]: checked } })
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Customers pay cash on delivery. Mobile money appears in the app once a payment
                provider account (for example Selcom or AzamPay) is connected to the server.
              </p>
            </section>
            <section className="rounded-xl border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-semibold">Notifications</h2>
              <div className="space-y-4">
                {(
                  [
                    ["newOrderAlerts", "New order alerts"],
                    ["deliveryAlerts", "Delivery alerts"],
                    ["paymentAlerts", "Payment alerts"],
                  ] as const
                ).map(([key, label]) => (
                  <div className="flex items-center justify-between" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      checked={value.notifications[key]}
                      onCheckedChange={(checked) =>
                        setDraft({
                          ...value,
                          notifications: { ...value.notifications, [key]: checked },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
              <h2 className="font-semibold">Delivery</h2>
              <DeliveryZonesEditor
                delivery={value.delivery}
                onChange={(delivery) => setDraft({ ...value, delivery })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="time-windows">Default delivery time windows</Label>
                <Textarea
                  id="time-windows"
                  required
                  value={value.delivery.defaultTimeWindows.join("\n")}
                  onChange={(e) =>
                    setDraft({
                      ...value,
                      delivery: {
                        ...value.delivery,
                        defaultTimeWindows: e.target.value.split("\n"),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  One per line, for example 09:00 - 12:00. Customers pick from these in the app,
                  next to "As soon as possible".
                </p>
              </div>
            </section>
            {save.isError && (
              <p role="alert" className="text-sm text-destructive">
                {isApiError(save.error)
                  ? save.error.message
                  : "Could not save settings. Please try again."}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                disabled={
                  !dirty ||
                  save.isPending ||
                  (!value.payments.cashEnabled && !value.payments.mobileMoneyEnabled) ||
                  !value.delivery.defaultTimeWindows.some((w) => w.trim())
                }
              >
                {save.isPending ? "Saving..." : "Save settings"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!dirty}
                onClick={() => {
                  setDraft(null);
                  save.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      ) : null}
    </div>
  );
}
