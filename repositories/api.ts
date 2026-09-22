import { addressesService } from "../services/addresses";
import { authService } from "../services/auth";
import { businessService } from "../services/business";
import { driverService } from "../services/driver";
import { notificationsService } from "../services/notifications";
import { ordersService } from "../services/orders";
import { paymentsService } from "../services/payments";
import { settingsService } from "../services/settings";
import { userService } from "../services/user";
import type { AppRepositories } from "./contracts";

export const apiRepositories: AppRepositories = {
  auth: {
    register: authService.register,
    login: authService.login,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
    refresh: authService.refresh,
    logout: authService.logout,
    getCurrentUser: userService.me
  },
  user: {
    getCurrentUser: userService.me,
    update: userService.update,
    changePassword: userService.changePassword
  },
  addresses: addressesService,
  orders: ordersService,
  driver: driverService,
  payments: paymentsService,
  notifications: notificationsService,
  settings: settingsService,
  business: businessService
};