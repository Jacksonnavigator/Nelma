import type { AddressLocationPreference, LanguagePreference } from "./user";

/** A customer as the offline demo mode (mock repositories) keeps it. */
export type CustomerRecord = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  preferredLanguage?: LanguagePreference;
  addressLocationPreference?: AddressLocationPreference;
  primaryArea?: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
};
