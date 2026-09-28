export type DeliveryAddress = {
  deliveryAddress: string;
  area: string;
  phone: string;
  deliveryInstructions?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type SavedAddress = DeliveryAddress & {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertSavedAddressInput = DeliveryAddress & {
  label: string;
};
