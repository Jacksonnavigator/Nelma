import type { SavedAddress, UpsertSavedAddressInput } from "../types/address";
import type { AuthSession, ChangePasswordInput, ForgotPasswordInput, ForgotPasswordResult, LoginInput, RegisterInput, ResetPasswordInput } from "../types/auth";
import type { BusinessDashboard } from "../types/business";
import type { Notification } from "../types/notification";
import type { DriverSummary } from "../types/driver";
import type { PaginatedResult } from "../types/api";
import type { CreateOrderInput, CreateOrderMessageInput, DeliveryIssueInput, DriverDeliveryActionStatus, DriverDeliveryHandover, Order } from "../types/order";
import type { InitializePaymentInput, Payment, PaymentMethod } from "../types/payment";
import type { PublicSettings } from "../types/settings";
import type { UpdateUserInput, User } from "../types/user";

export type AuthRepository = {
  register(input: RegisterInput): Promise<AuthSession>;
  login(input: LoginInput): Promise<AuthSession>;
  forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  refresh(refreshToken: string): Promise<AuthSession>;
  logout(refreshToken: string): Promise<void>;
  getCurrentUser(): Promise<User>;
};

export type UserRepository = {
  getCurrentUser(): Promise<User>;
  update(input: UpdateUserInput): Promise<User>;
  changePassword(input: ChangePasswordInput): Promise<void>;
};

export type AddressRepository = {
  list(): Promise<SavedAddress[]>;
  create(input: UpsertSavedAddressInput): Promise<SavedAddress>;
  update(id: string, input: UpsertSavedAddressInput): Promise<SavedAddress>;
  remove(id: string): Promise<void>;
};

export type OrderRepository = {
  list(): Promise<Order[]>;
  getById(id: string): Promise<Order>;
  create(input: CreateOrderInput): Promise<Order>;
  cancel(id: string): Promise<Order>;
  confirmReceived(id: string): Promise<Order>;
  message(id: string, input: CreateOrderMessageInput): Promise<Order>;
  getDeliveryCode(id: string): Promise<string>;
};

export type DriverRepository = {
  listActive(): Promise<Order[]>;
  listHistory(page: number, pageSize?: number): Promise<PaginatedResult<Order>>;
  getDelivery(id: string): Promise<Order>;
  updateStatus(id: string, status: DriverDeliveryActionStatus, handover?: DriverDeliveryHandover): Promise<Order>;
  reportIssue(id: string, input: DeliveryIssueInput): Promise<Order>;
  getSummary(): Promise<DriverSummary>;
};

export type PaymentRepository = {
  listMethods(): Promise<PaymentMethod[]>;
  initialize(input: InitializePaymentInput): Promise<Payment>;
  getById(id: string): Promise<Payment>;
};

export type NotificationRepository = {
  list(): Promise<Notification[]>;
  markRead(id: string): Promise<Notification>;
  readAll(): Promise<void>;
};

export type SettingsRepository = {
  public(): Promise<PublicSettings>;
};

export type BusinessRepository = {
  dashboard(): Promise<BusinessDashboard>;
};

export type AppRepositories = {
  auth: AuthRepository;
  user: UserRepository;
  addresses: AddressRepository;
  orders: OrderRepository;
  driver: DriverRepository;
  payments: PaymentRepository;
  notifications: NotificationRepository;
  settings: SettingsRepository;
  business: BusinessRepository;
};
