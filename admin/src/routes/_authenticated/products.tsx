import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { DeliveryFeesCard } from "@/components/products/DeliveryFeesCard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { productsService } from "@/services";
import { isApiError } from "@/services/api";
import { formatDateTime, formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "NELMA | Products" },
      {
        name: "description",
        content: "Add NELMA products and set their names, prices and pictures.",
      },
    ],
  }),
  component: () => (
    <PermissionGate permission="pricing.manage">
      <ProductsPage />
    </PermissionGate>
  ),
});

const MAX_IMAGE_MB = 5;

function ProductsPage() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: () => productsService.list() });
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const toggle = useMutation({
    mutationFn: (p: Product) => productsService.update(p.id, { isActive: !p.isActive }),
    onSuccess: (p) => {
      toast.success(
        p.isActive ? `${p.name} is on sale again` : `${p.name} is hidden from customers`,
      );
      void qc.invalidateQueries();
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : "Could not change this product"),
  });

  const onSale = products.data?.filter((p) => p.isActive).length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prices & delivery"
        description="Products, their prices and the delivery fees customers pay. Changes apply to new orders only."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 size-4" /> Add product
          </Button>
        }
      />

      {products.isError ? (
        <ErrorState
          description="Products could not be loaded."
          onRetry={() => products.refetch()}
        />
      ) : products.isLoading ? (
        <LoadingSkeleton variant="cards" rows={3} />
      ) : !products.data?.length ? (
        <EmptyState
          title="No products yet"
          description="Add the first product customers can order."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {onSale} of {products.data.length} on sale in the app.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.data.map((p) => (
              <article
                key={p.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card",
                  !p.isActive && "opacity-70",
                )}
              >
                <ProductImage product={p} />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-tight text-foreground">{p.name}</h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        p.isActive
                          ? "bg-brand-green/20 text-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.isActive ? "On sale" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatTZS(p.price)}
                  </p>
                  {p.description ? (
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  ) : null}
                  <p className="mt-auto pt-2 text-xs text-muted-foreground">
                    {p.orderCount} {p.orderCount === 1 ? "order" : "orders"}
                    {p.updatedAt ? ` · updated ${formatDateTime(p.updatedAt)}` : ""}
                  </p>
                  <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <Switch
                        checked={p.isActive}
                        disabled={toggle.isPending}
                        onCheckedChange={() => toggle.mutate(p)}
                        aria-label={`Show ${p.name} in the app`}
                      />
                      Show in app
                    </label>
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <DeliveryFeesCard />

      <ProductEditor
        product={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void qc.invalidateQueries();
        }}
      />
    </div>
  );
}

// The phone app ships these two pictures and shows them until a new one is uploaded.
const BUILT_IN_PICTURES: Partial<Record<string, string>> = {
  first_purchase: "/products/first_purchase.jpg",
  refill: "/products/refill.jpg",
};

function ProductImage({
  product,
  className,
}: {
  product: Pick<Product, "imageUrl" | "name"> & { code?: string | undefined };
  className?: string;
}) {
  const builtIn = !product.imageUrl && product.code ? BUILT_IN_PICTURES[product.code] : undefined;
  const src = product.imageUrl ?? builtIn;
  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted/60",
        className,
      )}
    >
      {src ? (
        <>
          <img
            src={src}
            alt={product.name}
            className="absolute inset-0 size-full object-contain"
            loading="lazy"
          />
          {builtIn ? (
            <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] text-muted-foreground">
              Built-in picture
            </span>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Package className="size-8" />
          <span className="text-xs">No picture yet</span>
        </div>
      )}
    </div>
  );
}

function ProductEditor({
  product,
  open,
  onClose,
  onSaved,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPrice(product ? String(product.price) : "");
    setImageUrl(product?.imageUrl ?? "");
    setFile(null);
  }, [open, product]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const parsed = Number(price);
  const priceOk = price.trim() !== "" && Number.isSafeInteger(parsed) && parsed > 0;
  const nameOk = name.trim().length >= 2;
  const linkOk = !imageUrl.trim() || /^https:\/\/\S+$/.test(imageUrl.trim());
  const valid = nameOk && priceOk && linkOk;

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        name: name.trim(),
        description: description.trim(),
        price: parsed,
        // A newly picked file replaces any link, so only send the link when no file is waiting.
        ...(file ? {} : { imageUrl: imageUrl.trim() || (product ? "" : null) }),
      };
      const saved = product
        ? await productsService.update(product.id, input)
        : await productsService.create(input);
      if (!file) return { saved, imageFailed: null };
      try {
        return { saved: await productsService.uploadImage(saved.id, file), imageFailed: null };
      } catch (error) {
        return {
          saved,
          imageFailed: isApiError(error) ? error.message : "The picture could not be uploaded.",
        };
      }
    },
    onSuccess: ({ saved, imageFailed }) => {
      if (imageFailed)
        toast.warning(`${saved.name} was saved, but the picture was not: ${imageFailed}`);
      else toast.success(product ? "Product updated" : `${saved.name} added`);
      onSaved();
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : "Could not save this product"),
  });

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(picked.type)) {
      toast.error("Choose a JPG, PNG or WebP picture.");
      return;
    }
    if (picked.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Pictures must be smaller than ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setFile(picked);
  };

  const shown = preview ?? (linkOk && imageUrl.trim() ? imageUrl.trim() : null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? `Edit ${product.name}` : "Add product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Changes show in the app straight away."
              : "It appears in the app as soon as you save it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Picture</Label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="group relative block w-full overflow-hidden rounded-lg border border-dashed border-border"
            >
              <ProductImage
                product={{ imageUrl: shown, name: name || "Product", code: product?.code }}
                className="aspect-[16/9]"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-background/85 py-2 text-sm font-medium text-foreground opacity-90 group-hover:opacity-100">
                <ImagePlus className="size-4" /> {shown ? "Change picture" : "Upload picture"}
              </span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {file ? (
              <p className="text-xs text-muted-foreground">
                {file.name} will be uploaded when you save.{" "}
                <button type="button" className="underline" onClick={() => setFile(null)}>
                  Remove
                </button>
              </p>
            ) : (
              <div className="space-y-1">
                <Input
                  placeholder="Or paste a picture link (https://…)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  aria-label="Picture link"
                />
                {!linkOk ? (
                  <p className="text-xs text-destructive">Links must start with https://</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 10L water refill"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-price">Price (TZS)</Label>
            <Input
              id="product-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="4000"
            />
            {price && priceOk ? (
              <p className="text-xs text-muted-foreground">{formatTZS(parsed)} per unit</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-description">Short description (optional)</Label>
            <Textarea
              id="product-description"
              value={description}
              maxLength={300}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown under the name in the app"
            />
          </div>
          {product && product.orderCount > 0 && Number(price) !== product.price && priceOk ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Existing orders keep the price they were placed at.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : product ? "Save changes" : "Add product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
