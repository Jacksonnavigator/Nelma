import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatTZS } from "@/lib/format";
import type { PriceConfiguration } from "@/types";

export function PriceEditModal({
  open,
  onOpenChange,
  price,
  loading,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price: PriceConfiguration | null;
  loading?: boolean;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open && price) setValue(String(price.price));
  }, [open, price]);

  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isSafeInteger(parsed) && parsed > 0;
  const error =
    value.trim() === ""
      ? "Enter a price."
      : !Number.isFinite(parsed)
        ? "Price must be a number."
        : !Number.isSafeInteger(parsed)
          ? "Enter a whole-number price."
          : parsed <= 0
            ? "Price must be greater than zero."
            : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update price</DialogTitle>
            <DialogDescription>{price?.label ?? "Product"} — amount in TZS.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="price-input">Price (TZS)</Label>
            <Input
              id="price-input"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {valid ? (
              <p className="text-xs text-muted-foreground">New price: {formatTZS(parsed)}</p>
            ) : (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button disabled={!valid || loading} onClick={() => setConfirming(true)}>
              Save price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Update this price?"
        description={
          valid
            ? `${price?.label ?? "Product"} will be set to ${formatTZS(parsed)}.`
            : "Enter a valid price."
        }
        confirmLabel="Update price"
        loading={loading === true}
        onConfirm={() => {
          if (!valid) return;
          onSave(parsed);
          setConfirming(false);
        }}
      />
    </>
  );
}
