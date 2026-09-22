export type LanguagePreference = "en" | "sw";
export type UserRole = "USER" | "DRIVER" | "SALES_MANAGER" | "SYSTEM_ADMIN";
export type AddressLocationPreference = "single" | "multiple";

export type User = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  preferredLanguage?: LanguagePreference;
  addressLocationPreference?: AddressLocationPreference;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
};

export type NotificationPreferences = {
  orderUpdates: boolean;
  paymentUpdates: boolean;
  promotions: boolean;
  systemAnnouncements: boolean;
};

export type UpdateUserInput = Partial<Pick<User, "fullName" | "phone" | "email" | "avatarUrl" | "preferredLanguage" | "addressLocationPreference">> & {
  notificationPreferences?: Partial<NotificationPreferences>;
};
