import { apiClient } from "./api";
import type { AuthSession, ForgotPasswordInput, ForgotPasswordResult, LoginInput, RegisterInput, ResetPasswordInput } from "../types/auth";

export const authService = {
  register(input: RegisterInput): Promise<AuthSession> {
    return apiClient.post<AuthSession>("/auth/register", {
      ...input,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase()
    }, false);
  },

  login(input: LoginInput): Promise<AuthSession> {
    return apiClient.post<AuthSession>("/auth/login", input, false);
  },

  forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    return apiClient.post<ForgotPasswordResult>("/auth/forgot-password", input, false);
  },

  resetPassword(input: ResetPasswordInput): Promise<void> {
    return apiClient.post<void>("/auth/reset-password", input, false);
  },

  refresh(refreshToken: string): Promise<AuthSession> {
    return apiClient.post<AuthSession>("/auth/refresh", { refreshToken }, false);
  },

  logout(refreshToken: string, pushToken?: string | null): Promise<void> {
    return apiClient.post<void>("/auth/logout", { refreshToken, ...(pushToken ? { pushToken } : {}) }, false);
  }
};
