import type { OrderType } from "./order";

export type PublicProductSetting = {
  name: string;
  unitPrice: number;
  /** Missing on backends from before the product catalog. */
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type PublicSettings = {
  currency: string;
  products: Record<OrderType, PublicProductSetting>;
};