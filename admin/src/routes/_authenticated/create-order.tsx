import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Info } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { ErrorState, LoadingSkeleton } from "@/components/common/states";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { customersService, ordersService, pricingService, settingsService } from "@/services";
import { PRODUCT_LABELS, formatTZS, businessDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Customer, DeliveryLocation, OrderType, PaymentMethod } from "@/types";

export const Route = createFileRoute("/_authenticated/create-order")({
  head: () => ({
    meta: [
      { title: "NELMA | Create order" },
      {
        name: "description",
        content: "Place a walk-in or phone water order on behalf of a NELMA customer.",
      },
      { property: "og:title", content: "NELMA | Create order" },
      {
        property: "og:description",
        content: "Place a walk-in or phone water order on behalf of a NELMA customer.",
      },
    ],
  }),
  component: () => (
    <PermissionGate permission="orders.create">
      <CreateOrderPage />
    </PermissionGate>
  ),
});

const STEPS = ["Customer", "Product", "Delivery", "Payment", "Review"];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
            i === step
              ? "border-primary/30 bg-primary/10 text-primary"
              : i < step
                ? "border-success/25 bg-success/10 text-success"
                : "border-border bg-card text-muted-foreground",
          )}
        >
          {i < step ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
          {label}
        </li>
      ))}
    </ol>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function CreateOrderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [product, setProduct] = useState<OrderType>("refill");
  const [quantity, setQuantity] = useState(1);
  const [savedLocationIdx, setSavedLocationIdx] = useState<number | null>(null);
  const [location, setLocation] = useState<DeliveryLocation>({
    label: "New location",
    area: "",
    addressLine: "",
    instructions: "",
    phone: "",
  });
  const [deliveryDate, setDeliveryDate] = useState(() => businessDate());
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [paymentMethod] = useState<PaymentMethod>("cash");

  const customers = useQuery({
    queryKey: ["customers", search],
    queryFn: () => customersService.search(search),
  });
  const prices = useQuery({ queryKey: ["prices"], queryFn: () => pricingService.list() });
  const settings = useQuery({
    queryKey: ["order-options"],
    queryFn: () => settingsService.orderOptions(),
  });

  const windows = settings.data?.delivery.defaultTimeWindows ?? [];
  const unitPrice = prices.data?.find((p) => p.product === product)?.price ?? 0;
  const subtotal = unitPrice * quantity;

  const create = useMutation({
    mutationFn: () =>
      ordersService.create(
        {
          customerId: customer!.id,
          product,
          quantity,
          deliveryLocation: {
            label: location.label,
            area: location.area,
            addressLine: location.addressLine,
            ...(location.instructions ? { instructions: location.instructions } : {}),
            ...(location.phone ? { phone: location.phone } : {}),
          },
          deliveryDate,
          deliveryWindow: deliveryWindow || (windows[0] ?? "08:00 – 10:00"),
          paymentMethod,
        },
        user!,
      ),
    onSuccess: (order) => {
      toast.success("Order created");
      qc.invalidateQueries();
      navigate({ to: "/orders/$id", params: { id: order.id } });
    },
    onError: (error) =>
      toast.error(
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Order could not be created",
      ),
  });

  const stepValid = useMemo(() => {
    if (step === 0) return !!customer;
    if (step === 1) return Number.isInteger(quantity) && quantity > 0 && !!prices.data?.length;
    if (step === 2)
      return (
        windows.length > 0 &&
        !!location.area.trim() &&
        !!location.addressLine.trim() &&
        deliveryDate >= businessDate()
      );
    return true;
  }, [step, customer, quantity, location, deliveryDate, prices.data, windows.length]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Order"
        description="Place an order for a walk-in or phone customer. Pricing comes from the server."
      />
      <Stepper step={step} />
      {prices.isError && (
        <ErrorState
          description="Prices could not be loaded. Retry before placing an order."
          onRetry={() => prices.refetch()}
        />
      )}
      {settings.isError && (
        <ErrorState
          description="Delivery options could not be loaded."
          onRetry={() => settings.refetch()}
        />
      )}
      {customers.isError && (
        <ErrorState
          description="Customers could not be loaded."
          onRetry={() => customers.refetch()}
        />
      )}
      {customers.isLoading && step === 0 && <LoadingSkeleton rows={3} />}

      {step === 0 ? (
        <Panel title="Select customer">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(customers.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCustomer(c);
                  setSavedLocationIdx(c.savedLocations.length ? 0 : null);
                  setLocation(
                    c.savedLocations[0] ?? {
                      label: "New location",
                      area: "",
                      addressLine: "",
                      instructions: "",
                      phone: c.phone,
                    },
                  );
                }}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  customer?.id === c.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50",
                )}
              >
                <p className="text-sm font-medium text-foreground">{c.fullName}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </button>
            ))}
            {customers.data && customers.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customers match that search.</p>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {step === 1 ? (
        <Panel title="Product and quantity">
          <RadioGroup
            value={product}
            onValueChange={(v) => setProduct(v as OrderType)}
            className="grid gap-3 sm:grid-cols-2"
          >
            {(["refill", "first_purchase"] as OrderType[]).map((p) => (
              <Label
                key={p}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                  product === p ? "border-primary bg-primary/5" : "border-border bg-card",
                )}
              >
                <RadioGroupItem value={p} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    {PRODUCT_LABELS[p]}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatTZS(prices.data?.find((x) => x.product === p)?.price ?? 0)} per unit
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          <div className="mt-4 max-w-40 space-y-1">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Subtotal <span className="font-medium text-foreground">{formatTZS(subtotal)}</span>. Any
            delivery charge is applied by the backend.
          </p>
        </Panel>
      ) : null}

      {step === 2 ? (
        <Panel title="Delivery details">
          {customer?.savedLocations.length ? (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {customer.savedLocations.map((loc, i) => (
                <button
                  key={loc.id ?? i}
                  type="button"
                  onClick={() => {
                    setSavedLocationIdx(i);
                    setLocation(loc);
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left",
                    savedLocationIdx === i
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{loc.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {loc.area} · {loc.addressLine}
                  </p>
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Area</Label>
              <Input
                value={location.area}
                onChange={(e) => {
                  setSavedLocationIdx(null);
                  setLocation({ ...location, area: e.target.value });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Contact phone</Label>
              <Input
                value={location.phone ?? ""}
                onChange={(e) => setLocation({ ...location, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Address</Label>
              <Input
                value={location.addressLine}
                onChange={(e) => {
                  setSavedLocationIdx(null);
                  setLocation({ ...location, addressLine: e.target.value });
                }}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Delivery instructions</Label>
              <Textarea
                rows={3}
                value={location.instructions ?? ""}
                onChange={(e) => setLocation({ ...location, instructions: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Delivery date</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Time window</Label>
              <select
                value={deliveryWindow || windows[0] || ""}
                onChange={(e) => setDeliveryWindow(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {windows.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Panel>
      ) : null}

      {step === 3 ? (
        <Panel title="Payment method">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-primary bg-primary/5 p-3">
              <Check className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Cash on delivery</p>
                <p className="text-xs text-muted-foreground">
                  Cash on delivery. Payment status is tracked separately from delivery.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 opacity-70">
              <Info className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mobile money</p>
                <p className="text-xs text-muted-foreground">
                  Under construction — not yet available.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {step === 4 ? (
        <Panel title="Review and place order">
          <dl className="grid gap-2 sm:grid-cols-2">
            <Summary label="Customer" value={`${customer?.fullName} · ${customer?.phone}`} />
            <Summary label="Product" value={PRODUCT_LABELS[product]} />
            <Summary label="Quantity" value={String(quantity)} />
            <Summary label="Unit price" value={formatTZS(unitPrice)} />
            <Summary label="Subtotal" value={formatTZS(subtotal)} />
            <Summary label="Payment" value="Cash on delivery" />
            <Summary label="Delivery" value={`${location.area} · ${location.addressLine}`} />
            <Summary
              label="Scheduled"
              value={`${deliveryDate} · ${deliveryWindow || windows[0] || "—"}`}
            />
          </dl>
        </Panel>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!stepValid} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button disabled={create.isPending || !customer} onClick={() => create.mutate()}>
            {create.isPending ? "Placing order…" : "Place order"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
