import type {
  ActivityEvent,
  AdminAccount,
  AppNotification,
  AuditEvent,
  Customer,
  DashboardMetrics,
  DashboardRole,
  DashboardUser,
  Delivery,
  DeliveryStatus,
  Driver,
  OperationsOverview,
  Order,
  OrderStatus,
  OrderType,
  PaginatedResponse,
  PaymentMethod,
  PaymentStatus,
  PriceConfiguration,
  Product,
  SalesReport,
  UserAccount,
  UserAccountPage,
  SystemSettings,
} from "@/types";

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface OrderQuery extends PageQuery {
  status?: OrderStatus | "all";
  search?: string;
  product?: OrderType | "all";
  paymentMethod?: PaymentMethod | "all";
  paymentStatus?: PaymentStatus | "all";
  orderDate?: string;
  deliveryDate?: string;
}

export interface DeliveryQuery extends PageQuery {
  view?: "all" | "unassigned" | "assigned" | "out_for_delivery" | "delivered";
  search?: string;
}

export interface DriverQuery extends PageQuery {
  search?: string;
  status?: "all" | "active" | "inactive";
}

export interface AuditQuery extends PageQuery {
  actor?: string;
  action?: string;
  entity?: string;
  date?: string;
}

export interface CreateOrderInput {
  customerId: string;
  product: OrderType;
  quantity: number;
  deliveryLocation: {
    label: string;
    area: string;
    addressLine: string;
    instructions?: string;
    phone?: string;
  };
  deliveryDate: string;
  deliveryWindow: string;
  paymentMethod: PaymentMethod;
}

export interface CreateAccountInput {
  password?: string;
  fullName: string;
  phone: string;
  email: string;
  role: DashboardRole;
}

export interface DriverInput {
  password?: string;
  fullName: string;
  phone: string;
}

export type SalesPeriod = "today" | "week" | "month" | "custom";

export interface SalesQuery {
  period: SalesPeriod;
  from?: string;
  to?: string;
}

export interface AuthSession {
  token: string;
  user: DashboardUser;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface PasswordResetInput {
  identifier: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}
export interface AuthService {
  changePassword(input: PasswordChangeInput): Promise<void>;
  forgotPassword(identifier: string): Promise<{ message: string }>;
  resetPassword(input: PasswordResetInput): Promise<void>;
  /** POST /auth/dashboard/login */
  login(identifier: string, password: string): Promise<AuthSession>;
  logout(): Promise<void>;
  currentUser(): Promise<DashboardUser | null>;
  updateProfile(input: { fullName: string; email: string; phone: string }): Promise<DashboardUser>;
}

export interface OrdersService {
  /** GET /admin/dashboard */
  metrics(): Promise<DashboardMetrics>;
  activity(role: DashboardRole): Promise<ActivityEvent[]>;
  list(query: OrderQuery): Promise<PaginatedResponse<Order>>;
  get(id: string): Promise<Order>;
  create(input: CreateOrderInput, actor: DashboardUser): Promise<Order>;
  collectCash(id: string, amount: number): Promise<Order>;
  confirm(id: string): Promise<Order>;
  process(id: string): Promise<Order>;
  /** Staff reply shown to the customer in the app. */
  reply(id: string, body: string): Promise<Order>;
  cancel(id: string, reason: string): Promise<Order>;
  statusCounts(): Promise<{ status: OrderStatus; count: number }[]>;
}

export interface CustomersService {
  search(term: string): Promise<Customer[]>;
  get(id: string): Promise<Customer>;
}

export interface DeliveriesService {
  forOrder(orderId: string): Promise<Delivery | null>;
  list(query: DeliveryQuery): Promise<PaginatedResponse<Delivery>>;
  get(id: string): Promise<Delivery>;
  assignDriver(deliveryId: string, driverId: string): Promise<Delivery>;
  updateStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery>;
}

export interface DriversService {
  list(query: DriverQuery): Promise<PaginatedResponse<Driver>>;
  get(id: string): Promise<Driver>;
  available(): Promise<Driver[]>;
  create(input: DriverInput): Promise<Driver>;
  update(
    id: string,
    input: Partial<DriverInput> & { status?: "active" | "inactive" },
  ): Promise<Driver>;
  deliveriesFor(driverId: string): Promise<Delivery[]>;
}

export interface SalesService {
  /** GET /admin/reports/sales */
  report(query: SalesQuery): Promise<SalesReport>;
}

export interface PricingService {
  list(): Promise<PriceConfiguration[]>;
  update(product: OrderType, price: number, actor: string): Promise<PriceConfiguration>;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductsService {
  /** GET /admin/products — every product, including hidden ones. */
  list(): Promise<Product[]>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: Partial<ProductInput>): Promise<Product>;
  /** POST /admin/products/{id}/image — stores the file in Supabase Storage. */
  uploadImage(id: string, file: File): Promise<Product>;
}

export interface UserQuery extends PageQuery {
  role?: "all" | "USER" | "DRIVER" | "SALES_MANAGER" | "SYSTEM_ADMIN";
  status?: "all" | "active" | "inactive";
  search?: string;
}

export interface UsersService {
  /** GET /admin/users — customers, drivers and staff. */
  list(query: UserQuery): Promise<UserAccountPage>;
  setActive(id: string, active: boolean): Promise<UserAccount>;
  /** Sets a new password and signs the person out everywhere. */
  setPassword(id: string, password: string): Promise<void>;
}

export interface AdminAccountsService {
  list(): Promise<AdminAccount[]>;
  create(input: CreateAccountInput): Promise<AdminAccount>;
  update(
    id: string,
    input: Partial<CreateAccountInput> & { status?: "active" | "inactive" },
  ): Promise<AdminAccount>;
}

export interface SettingsService {
  orderOptions(): Promise<Pick<SystemSettings, "delivery" | "payments">>;
  get(): Promise<SystemSettings>;
  update(patch: Partial<SystemSettings>): Promise<SystemSettings>;
}

export interface AuditService {
  list(query: AuditQuery): Promise<PaginatedResponse<AuditEvent>>;
}

export interface NotificationsService {
  list(role: DashboardRole): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(role: DashboardRole): Promise<void>;
}

export interface OperationsService {
  /** GET /admin/operations */
  overview(): Promise<OperationsOverview>;
  /** POST /admin/operations/cash/{driverId}/hand-in */
  handIn(
    driverId: string,
    paymentIds: string[],
    amountReceived: number,
  ): Promise<{ settled: number }>;
  /** POST /admin/operations/flags/{id}/review */
  reviewFlag(id: string): Promise<void>;
}

export interface ServiceRegistry {
  auth: AuthService;
  orders: OrdersService;
  customers: CustomersService;
  deliveries: DeliveriesService;
  drivers: DriversService;
  sales: SalesService;
  pricing: PricingService;
  products: ProductsService;
  users: UsersService;
  adminAccounts: AdminAccountsService;
  settings: SettingsService;
  audit: AuditService;
  notifications: NotificationsService;
  operations: OperationsService;
}
