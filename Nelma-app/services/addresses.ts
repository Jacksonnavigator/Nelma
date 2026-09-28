import { apiClient } from "./api";
import type { SavedAddress, UpsertSavedAddressInput } from "../types/address";

export const addressesService = {
  list(): Promise<SavedAddress[]> {
    return apiClient.get<SavedAddress[]>("/addresses");
  },

  create(input: UpsertSavedAddressInput): Promise<SavedAddress> {
    return apiClient.post<SavedAddress>("/addresses", input);
  },

  update(id: string, input: UpsertSavedAddressInput): Promise<SavedAddress> {
    return apiClient.patch<SavedAddress>("/addresses/" + encodeURIComponent(id), input);
  },

  remove(id: string): Promise<void> {
    return apiClient.delete<void>("/addresses/" + encodeURIComponent(id));
  }
};
