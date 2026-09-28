import type { OrderType } from "./order";

export type PublicProductSetting = {
  name: string;
  unitPrice: number;
  /** Missing on backends from before the product catalog. */
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

/** Contacts staff set in the dashboard's System Settings. */
export type SupportInfo = {
  name: string;
  phone: string;
  email: string;
  address: string;
  operatingHours: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  keywords: string[];
};

/** Delivery fees and times staff set in the dashboard's System Settings. */
export type DeliveryConfig = {
  timeWindows: string[];
  zones: DeliveryZone[];
  defaultZoneName: string;
  defaultFee: number;
};

export type PublicSettings = {
  currency: string;
  products: Record<OrderType, PublicProductSetting>;
  /** Missing on backends from before these settings reached the app. */
  support?: SupportInfo | null;
  delivery?: DeliveryConfig | null;
};
