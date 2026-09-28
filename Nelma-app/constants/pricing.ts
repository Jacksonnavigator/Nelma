import type { OrderType } from "../types/order";

export const FIRST_PURCHASE = 18000;
export const REFILL = 4000;

// Pictures shipped inside the app for the two launch products, used until the dashboard sets one.
export type BundledProductImage = "new_bottle" | "refill";

export type ProductCatalogItem = {
  type: OrderType;
  label: string;
  productName: string;
  description: string;
  unitPrice: number;
  image?: BundledProductImage;
  /** Picture uploaded in the dashboard; wins over the bundled one. */
  imageUrl?: string | null;
  sortOrder: number;
};

/** Every product customers can order right now, keyed by product code. */
export type ProductCatalog = Record<OrderType, ProductCatalogItem>;

export const productCatalog: ProductCatalog = {
  first_purchase: {
    type: "first_purchase",
    label: "New bottle + 20L water",
    productName: "20L Water + New Container",
    description: "For your first order: a new reusable 20L bottle filled with drinking water.",
    unitPrice: FIRST_PURCHASE,
    image: "new_bottle",
    sortOrder: 0
  },
  refill: {
    type: "refill",
    label: "20L water refill",
    productName: "20L Drinking Water",
    description: "Fresh drinking water for the NELMA bottle you already have.",
    unitPrice: REFILL,
    image: "refill",
    sortOrder: 1
  }
};

const readableCode = (type: OrderType): string => {
  const words = type.replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Product";
};

/**
 * Look a product up safely. Orders can point at a product that has since been hidden
 * or renamed, so an unknown code still gets a readable name instead of crashing.
 */
export const catalogItem = (catalog: ProductCatalog, type: OrderType): ProductCatalogItem => {
  return catalog[type] ?? productCatalog[type] ?? {
    type,
    label: readableCode(type),
    productName: readableCode(type),
    description: "",
    unitPrice: 0,
    sortOrder: Number.MAX_SAFE_INTEGER
  };
};

export const sortedProducts = (catalog: ProductCatalog): ProductCatalogItem[] => {
  return Object.values(catalog).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
};
