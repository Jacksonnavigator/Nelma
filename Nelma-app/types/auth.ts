import type { DeliveryAddress } from "./address";
import type { AddressLocationPreference, LanguagePreference, User } from "./user";

export type SessionAudience = "mobile" | "dashboard";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  audience: SessionAudience;
};

export type AuthSession = {
  user: User;
  tokens: AuthTokens;
};

export type RegisterInput = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredLanguage?: LanguagePreference;
  addressLocationPreference?: AddressLocationPreference;
  signupAddress?: DeliveryAddress | null;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type ForgotPasswordInput = {
  identifier: string;
};

export type ForgotPasswordResult = {
  resetToken?: string;
  message: string;
};

export type ResetPasswordInput = {
  identifier: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
