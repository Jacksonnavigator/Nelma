import { apiClient } from "./api";
import type { PublicSettings } from "../types/settings";

export const settingsService = {
  public(): Promise<PublicSettings> {
    return apiClient.get<PublicSettings>("/settings/public", false);
  }
};
