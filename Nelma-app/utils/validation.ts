import type { DeliveryAddress, UpsertSavedAddressInput } from "../types/address";
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../types/auth";
import type { UpdateUserInput } from "../types/user";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:255[67]\d{8}|0[67]\d{8}|[67]\d{8})$/;
const validLanguages = ["en", "sw"];
const validAddressPreferences = ["single", "multiple"];

export const isEmail = (value: string): boolean => emailPattern.test(value.trim());
export const isPhone = (value: string): boolean => phonePattern.test(value.replace(/\D/g, "").replace(/^00/, ""));

export const validateIdentifier = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter your phone number or email.";
  }
  if (!isEmail(trimmed) && !isPhone(trimmed)) {
    return "Enter a valid phone number or email.";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Enter your password.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) {
    return "Password must be at most 128 characters.";
  }
  return null;
};

export const validateLogin = (input: LoginInput): FieldErrors<LoginInput> => {
  return {
    identifier: validateIdentifier(input.identifier) ?? undefined,
    password: validatePassword(input.password) ?? undefined
  };
};

export const validateRegistration = (input: RegisterInput): FieldErrors<RegisterInput> => {
  const errors: FieldErrors<RegisterInput> = {};
  if (input.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  }
  if (!isPhone(input.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (input.email.trim() && !isEmail(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!input.preferredLanguage || !validLanguages.includes(input.preferredLanguage)) {
    errors.preferredLanguage = "Choose English or Swahili.";
  }
  if (!input.addressLocationPreference || !validAddressPreferences.includes(input.addressLocationPreference)) {
    errors.addressLocationPreference = "Choose how you want to manage delivery locations.";
  }
  const passwordError = validatePassword(input.password);
  if (passwordError) {
    errors.password = passwordError;
  }
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }
  return errors;
};

export const validateForgotPassword = (input: ForgotPasswordInput): FieldErrors<ForgotPasswordInput> => ({
  identifier: validateIdentifier(input.identifier) ?? undefined
});

export const validateResetPassword = (input: ResetPasswordInput): FieldErrors<ResetPasswordInput> => {
  const errors: FieldErrors<ResetPasswordInput> = {};
  const identifierError = validateIdentifier(input.identifier);
  if (identifierError) {
    errors.identifier = identifierError;
  }
  if (!input.resetToken.trim()) {
    errors.resetToken = "Enter the verification code.";
  }
  const passwordError = validatePassword(input.newPassword);
  if (passwordError) {
    errors.newPassword = passwordError;
  }
  if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }
  return errors;
};

export const validateProfile = (input: UpdateUserInput): FieldErrors<UpdateUserInput> => {
  const errors: FieldErrors<UpdateUserInput> = {};
  if (input.fullName !== undefined && input.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  }
  if (input.phone !== undefined && !isPhone(input.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (input.email != null && input.email.trim() && !isEmail(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
};

export const validatePasswordChange = (input: ChangePasswordInput): FieldErrors<ChangePasswordInput> => {
  const errors: FieldErrors<ChangePasswordInput> = {};
  const currentError = validatePassword(input.currentPassword);
  if (currentError) {
    errors.currentPassword = currentError;
  }
  const newError = validatePassword(input.newPassword);
  if (newError) {
    errors.newPassword = newError;
  }
  if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }
  return errors;
};

export const validateDeliveryAddress = (input: DeliveryAddress): FieldErrors<DeliveryAddress> => {
  const errors: FieldErrors<DeliveryAddress> = {};
  if (input.deliveryAddress.trim().length < 5) {
    errors.deliveryAddress = "Enter the full delivery address.";
  }
  if (input.area.trim().length < 2) {
    errors.area = "Enter the area or neighborhood.";
  }
  if (!isPhone(input.phone)) {
    errors.phone = "Enter a valid contact phone number.";
  }
  if (input.latitude !== null && input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) {
    errors.latitude = "Latitude is outside the valid range.";
  }
  if (input.longitude !== null && input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) {
    errors.longitude = "Longitude is outside the valid range.";
  }
  return errors;
};

export const validateSavedAddress = (input: UpsertSavedAddressInput): FieldErrors<UpsertSavedAddressInput> => {
  const errors: FieldErrors<UpsertSavedAddressInput> = {
    ...validateDeliveryAddress(input)
  };
  if (input.label.trim().length < 2) {
    errors.label = "Name this address, for example Home or Work.";
  }
  return errors;
};

export const hasErrors = <T extends Record<string, unknown>>(errors: FieldErrors<T>): boolean => {
  return Object.values(errors).some(Boolean);
};
