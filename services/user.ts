import { apiClient } from "./api";
import type { ChangePasswordInput } from "../types/auth";
import type { UpdateUserInput, User } from "../types/user";

export const userService = {
  me(): Promise<User> {
    return apiClient.get<User>("/users/me");
  },

  update(input: UpdateUserInput): Promise<User> {
    return apiClient.patch<User>("/users/me", input);
  },

  changePassword(input: ChangePasswordInput): Promise<void> {
    return apiClient.patch<void>("/users/me/security", input);
  }
};
