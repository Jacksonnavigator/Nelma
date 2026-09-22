import type { OrderType } from "../types/order";

export const FIRST_PURCHASE = 18000;
export const REFILL = 4000;

export type ProductCatalogItem = {
  type: OrderType;
  label: string;
  productName: string;
  description: string;
  unitPrice: number;
  image: "new_bottle" | "refill";
};

export type ProductCatalog = Record<OrderType, ProductCatalogItem>;

export const productCatalog: ProductCatalog = {
  first_purchase: {
    type: "first_purchase",
    label: "First Purchase",
    productName: "20L Water + New Container",
    description: "For customers getting NELMA at this address for the first time.",
    unitPrice: FIRST_PURCHASE,
    image: "new_bottle"
  },
  refill: {
    type: "refill",
    label: "Refill",
    productName: "20L Drinking Water",
    description: "Fresh drinking water for your existing 20L container.",
    unitPrice: REFILL,
    image: "refill"
  }
};