import type { OrderType } from "./order";

export type PublicProductSetting = {
  name: string;
  unitPrice: number;
};

export type PublicSettings = {
  currency: string;
  products: Record<OrderType, PublicProductSetting>;
};