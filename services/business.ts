import { apiClient } from "./api";
import type { BusinessDashboard } from "../types/business";

export const businessService = {
  dashboard(): Promise<BusinessDashboard> {
    return apiClient.get<BusinessDashboard>("/business/dashboard");
  }
};
