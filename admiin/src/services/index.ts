import { DATA_MODE } from "@/services/api";
import { httpServices } from "@/services/http";
import type { ServiceRegistry } from "@/services/contracts";

/**
 * Repository injection point.
 *
 * VITE_DATA_MODE=mock -> explicitly selected, non-production demo repositories
 * VITE_DATA_MODE=api  -> the existing NELMA FastAPI backend
 *
 * Screens import `services` only. Swapping the data source requires no screen
 * changes. The backend remains authoritative for authorization and pricing.
 */
// Direct build-time condition removes demo identities from API production assets.
export const services: ServiceRegistry =
  import.meta.env["VITE_DATA_MODE"] === "mock"
    ? (await import("@/services/mock")).mockServices
    : httpServices;

export const authService = services.auth;
export const ordersService = services.orders;
export const customersService = services.customers;
export const deliveriesService = services.deliveries;
export const driversService = services.drivers;
export const salesService = services.sales;
export const pricingService = services.pricing;
export const productsService = services.products;
export const usersService = services.users;
export const adminAccountsService = services.adminAccounts;
export const settingsService = services.settings;
export const auditService = services.audit;
export const notificationsService = services.notifications;
export const operationsService = services.operations;

export { DATA_MODE };
export type { ServiceRegistry };
export const websiteRequestsService = services.websiteRequests;
