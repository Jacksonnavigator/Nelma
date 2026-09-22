import type { SavedAddress, UpsertSavedAddressInput } from "../types/address";
import type { AuthSession, ChangePasswordInput, ForgotPasswordInput, ForgotPasswordResult, LoginInput, RegisterInput, ResetPasswordInput } from "../types/auth";
import type { BusinessDashboard } from "../types/business";
import type { Notification } from "../types/notification";
import type { CreateOrderInput, CreateOrderMessageInput, DriverDeliveryActionStatus, Order } from "../types/order";
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
};

export type DriverRepository = {
  listDeliveries(): Promise<Order[]>;
  getDelivery(id: string): Promise<Order>;
  updateStatus(id: string, status: DriverDeliveryActionStatus): Promise<Order>;
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
