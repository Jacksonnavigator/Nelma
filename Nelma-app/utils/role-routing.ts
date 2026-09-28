import type { User, UserRole } from "../types/user";

export const isDriverRole = (role?: UserRole | null): boolean => role === "DRIVER";

export const isDashboardRole = (role?: UserRole | null): boolean => role === "SALES_MANAGER" || role === "SYSTEM_ADMIN";

export const isMobileRole = (role?: UserRole | null): boolean => role === "USER" || role === "DRIVER";

export const mobileLandingForUser = (user?: Pick<User, "role"> | null): "/driver/(tabs)/deliveries" | "/(tabs)/home" => {
  return isDriverRole(user?.role) ? "/driver/(tabs)/deliveries" : "/(tabs)/home";
};