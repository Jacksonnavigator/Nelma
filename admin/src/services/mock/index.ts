import {
  adminAccounts as seedAccounts,
  adminActivity,
  auditEvents as seedAudit,
  customers as seedCustomers,
  deliveries as seedDeliveries,
  drivers as seedDrivers,
  notifications as seedNotifications,
  orders as seedOrders,
  pricing as seedPricing,
  recentActivity,
  systemSettings as seedSettings,
} from "@/mocks/data";
import { delay, setAuthToken } from "@/services/api";
import type {
  AdminAccount,
  AppNotification,
  AuditEvent,
  DashboardMetrics,
  DashboardUser,
  Delivery,
  Driver,
  OperationsOverview,
  Order,
  OrderStatus,
  OrderType,
  PaginatedResponse,
  PaymentStatus,
  PriceConfiguration,
  Product,
  SalesRecord,
  UserAccount,
  SalesReport,
  SystemSettings,
} from "@/types";
import { ORDER_LIFECYCLE, productLabel } from "@/lib/format";
import type {
  AuthSession,
  CreateAccountInput,
  CreateOrderInput,
  ServiceRegistry,
} from "@/services/contracts";

/**
 * In-memory mock repository layer. Development/demo only — mutations live for
 * the browser session and are discarded on reload. No backend, no database.
 */

const db = {
  orders: seedOrders.map((o) => ({ ...o })),
  deliveries: seedDeliveries.map((d) => ({ ...d })),
  drivers: seedDrivers.map((d) => ({ ...d })),
  accounts: seedAccounts.map((a) => ({ ...a })),
  products: seedPricing.map((p, index): Product => ({
    id: `prd_${p.product}`,
    code: p.product,
    name: p.label,
    description: "",
    price: p.price,
    imageUrl: null,
    isActive: true,
    sortOrder: index,
    orderCount: seedOrders.filter((o) => o.item.product === p.product).length,
    updatedAt: p.updatedAt,
  })),
  notifications: seedNotifications.map((n) => ({ ...n })),
  audit: seedAudit.map((a) => ({ ...a })),
  settings: structuredClone(seedSettings) as SystemSettings,
};

function priceOf(p: Product): PriceConfiguration {
  return {
    product: p.code,
    label: p.name,
    price: p.price,
    currency: "TZS",
    updatedAt: p.updatedAt,
    updatedBy: "Dashboard",
  };
}

function paginate<T>(items: T[], page = 1, pageSize = 10): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function todayISO(): string {
  return new Date().toISOString();
}

function pushAudit(event: Omit<AuditEvent, "id" | "at">): void {
  db.audit.unshift({ ...event, id: `aud_${Date.now()}`, at: todayISO() });
}

const DEMO_IDENTITIES: { identifier: string[]; password: string; user: DashboardUser }[] = [
  {
    identifier: ["asha.mrisho@nelma.example", "+255711220044", "sales"],
    password: "nelma1234",
    user: {
      id: "usr_sm_1",
      fullName: "Asha Mrisho",
      email: "asha.mrisho@nelma.example",
      phone: "+255711220044",
      role: "SALES_MANAGER",
      status: "active",
    },
  },
  {
    identifier: ["omary.nassoro@nelma.example", "+255789112233", "admin"],
    password: "nelma1234",
    user: {
      id: "usr_ad_1",
      fullName: "Omary Nassoro",
      email: "omary.nassoro@nelma.example",
      phone: "+255789112233",
      role: "SYSTEM_ADMIN",
      status: "active",
    },
  },
];

const SESSION_KEY = "nelma.dashboard.session";

function readSession(): DashboardUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DashboardUser;
  } catch {
    return null;
  }
}

function writeSession(user: DashboardUser | null): void {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
}

export const mockServices: ServiceRegistry = {
  auth: {
    async changePassword() {
      throw { status: 400, message: "Password management requires API mode." };
    },
    async forgotPassword() {
      throw { status: 400, message: "Password reset requires API mode." };
    },
    async resetPassword() {
      throw { status: 400, message: "Password reset requires API mode." };
    },
    async login(identifier, password): Promise<AuthSession> {
      const key = identifier.trim().toLowerCase();
      const match = DEMO_IDENTITIES.find((d) => d.identifier.includes(key));
      if (!match || password !== match.password) {
        throw { status: 401, message: "Incorrect credentials. Please try again." };
      }
      const account = db.accounts.find((a) => a.id === match.user.id);
      if (account?.status === "inactive")
        throw { status: 403, message: "This account is inactive. Contact a system administrator." };
      const user = account ? { ...account } : match.user;
      await delay(null, 500);
      setAuthToken(`mock.${user.id}`);
      writeSession(user);
      return { token: `mock.${user.id}`, user };
    },
    async logout() {
      setAuthToken(null);
      writeSession(null);
      await delay(null, 120);
    },
    async currentUser() {
      return delay(readSession(), 60);
    },
    async updateProfile(input) {
      const current = readSession();
      if (!current) throw { status: 401, message: "Not signed in." };
      const next: DashboardUser = { ...current, ...input };
      const account = db.accounts.find((a) => a.id === current.id);
      if (account) Object.assign(account, input);
      const identity = DEMO_IDENTITIES.find((d) => d.user.id === current.id);
      if (identity) {
        identity.user = next;
        identity.identifier = [
          input.email.toLowerCase(),
          input.phone,
          ...identity.identifier.filter((i) => i === "admin" || i === "sales"),
        ];
      }
      writeSession(next);
      return delay(next);
    },
  },

  orders: {
    async metrics(): Promise<DashboardMetrics> {
      const today = todayISO();
      const todays = db.orders.filter((o) => sameDay(o.createdAt, today));
      const metrics: DashboardMetrics = {
        todayOrders: todays.length,
        pendingOrders: db.orders.filter((o) => o.status === "pending").length,
        processing: db.orders.filter((o) => o.status === "processing").length,
        outForDelivery: db.orders.filter((o) => o.status === "out_for_delivery").length,
        completedToday: todays.filter(
          (o) => o.status === "delivered" || o.status === "customer_received",
        ).length,
        todaySales: todays
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + o.total, 0),
        pendingPayments: db.orders.filter((o) => o.paymentStatus === "pending").length,
        activeDrivers: db.drivers.filter((d) => d.status === "active").length,
        activeSalesManagers: db.accounts.filter(
          (a) => a.role === "SALES_MANAGER" && a.status === "active",
        ).length,
        pendingDeliveries: db.deliveries.filter((d) => d.status === "unassigned").length,
        systemStatus: "operational",
      };
      return delay(metrics);
    },
    async activity(role) {
      return delay(role === "SYSTEM_ADMIN" ? adminActivity : recentActivity);
    },
    async list(query) {
      let items = [...db.orders];
      if (query.status && query.status !== "all")
        items = items.filter((o) => o.status === query.status);
      if (query.product && query.product !== "all")
        items = items.filter((o) => o.item.product === query.product);
      if (query.paymentMethod && query.paymentMethod !== "all")
        items = items.filter((o) => o.paymentMethod === query.paymentMethod);
      if (query.paymentStatus && query.paymentStatus !== "all")
        items = items.filter((o) => o.paymentStatus === query.paymentStatus);
      if (query.orderDate) items = items.filter((o) => sameDay(o.createdAt, query.orderDate!));
      if (query.deliveryDate)
        items = items.filter((o) => sameDay(o.requestedDeliveryDate, query.deliveryDate!));
      if (query.search) {
        const term = query.search.toLowerCase();
        items = items.filter(
          (o) =>
            o.customer.fullName.toLowerCase().includes(term) || o.customer.phone.includes(term),
        );
      }
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return delay(paginate(items, query.page, query.pageSize));
    },
    async get(id) {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw { status: 404, message: "This order could not be found." };
      return delay(order);
    },
    async create(input: CreateOrderInput, actor): Promise<Order> {
      const customer = seedCustomers.find((c) => c.id === input.customerId);
      if (!customer) throw { status: 400, message: "Select a valid customer." };
      const price = db.products.find((p) => p.code === input.product)?.price ?? 0;
      const subtotal = price * input.quantity;
      const order: Order = {
        id: `ord_${Date.now()}`,
        customer: { id: customer.id, fullName: customer.fullName, phone: customer.phone },
        item: { product: input.product, quantity: input.quantity, unitPrice: price, subtotal },
        status: "pending",
        createdAt: todayISO(),
        requestedDeliveryDate: input.deliveryDate,
        requestedDeliveryWindow: input.deliveryWindow,
        deliveryLocation: input.deliveryLocation,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        // Delivery charge is server-defined; mock keeps the customer app value.
        deliveryCharge: 2000,
        total: subtotal + 2000,
        source: "SALES_MANAGER_DASHBOARD",
        createdBy: { id: actor.id, fullName: actor.fullName, role: actor.role },
        assignedDriverId: null,
        timeline: ORDER_LIFECYCLE.map((status, i) => ({
          status,
          at: i === 0 ? todayISO() : null,
        })),
      };
      db.orders.unshift(order);
      pushAudit({
        actor: actor.fullName,
        role: actor.role,
        action: "ORDER_CREATED",
        entity: "Order",
        description: `Created a dashboard order for ${customer.fullName} (${input.quantity} × ${productLabel(input.product, db.products.find((p) => p.code === input.product)?.name)}).`,
      });
      return delay(order, 600);
    },
    async collectCash(id, amount) {
      const order = db.orders.find((o) => o.id === id);
      if (
        !order ||
        order.paymentMethod !== "cash" ||
        !["delivered", "customer_received"].includes(order.status) ||
        amount !== order.total
      )
        throw { status: 409, message: "Cash cannot be recorded for this order." };
      if (order.paymentStatus !== "pending" && !order.cashReceipt)
        throw { status: 409, message: "Payment is not pending." };
      order.paymentStatus = "paid";
      order.cashReceipt ??= { id: `CASH-${id}`, amount, collectedAt: new Date().toISOString() };
      return delay(order);
    },
    async confirm(id) {
      return advance(id, "pending", "confirmed");
    },
    async process(id) {
      return advance(id, "confirmed", "processing");
    },
    async reply(id, body) {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw { status: 404, message: "Order not found." };
      order.messages = [
        ...(order.messages ?? []),
        { id: `msg_${Date.now()}`, sender: "nelma", body, createdAt: new Date().toISOString() },
      ];
      return delay(structuredClone(order), 300);
    },
    async cancel(id, reason) {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw { status: 404, message: "Order not found." };
      if (["delivered", "customer_received", "cancelled"].includes(order.status)) {
        throw { status: 409, message: "Delivered or cancelled orders cannot be cancelled." };
      }
      order.status = "cancelled";
      if (order.paymentStatus === "pending") order.paymentStatus = "cancelled";
      order.messages = [
        ...(order.messages ?? []),
        {
          id: `msg_${Date.now()}`,
          sender: "system",
          body: `Cancelled by NELMA: ${reason}`,
          createdAt: new Date().toISOString(),
        },
      ];
      return delay(structuredClone(order), 400);
    },
    async statusCounts() {
      const counts = new Map<OrderStatus, number>();
      for (const o of db.orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
      return delay([...counts.entries()].map(([status, count]) => ({ status, count })));
    },
  },

  customers: {
    async search(term) {
      const t = term.trim().toLowerCase();
      const items = !t
        ? seedCustomers.slice(0, 6)
        : seedCustomers.filter((c) => c.fullName.toLowerCase().includes(t) || c.phone.includes(t));
      return delay(items, 220);
    },
    async get(id) {
      const customer = seedCustomers.find((c) => c.id === id);
      if (!customer) throw { status: 404, message: "Customer not found." };
      return delay(customer);
    },
  },

  deliveries: {
    forOrder: (orderId) =>
      delay(db.deliveries.find((delivery) => delivery.orderId === orderId) ?? null),
    async list(query) {
      let items = [...db.deliveries];
      if (query.view && query.view !== "all") items = items.filter((d) => d.status === query.view);
      if (query.search) {
        const t = query.search.toLowerCase();
        items = items.filter(
          (d) =>
            d.customerName.toLowerCase().includes(t) ||
            d.customerPhone.includes(t) ||
            d.location.area.toLowerCase().includes(t),
        );
      }
      items.sort((a, b) => +new Date(a.scheduledDate) - +new Date(b.scheduledDate));
      return delay(paginate(items, query.page, query.pageSize));
    },
    async get(id) {
      const delivery = db.deliveries.find((d) => d.id === id);
      if (!delivery) throw { status: 404, message: "Delivery not found." };
      return delay(delivery);
    },
    async assignDriver(deliveryId, driverId) {
      const delivery = db.deliveries.find((d) => d.id === deliveryId);
      const driver = db.drivers.find((d) => d.id === driverId);
      if (!delivery || !driver) throw { status: 404, message: "Delivery or driver not found." };
      delivery.driverId = driverId;
      if (delivery.status === "unassigned") delivery.status = "assigned";
      driver.todayAssigned += 1;
      const order = db.orders.find((o) => o.id === delivery.orderId);
      if (order) order.assignedDriverId = driverId;
      return delay({ ...delivery }, 450);
    },
    async updateStatus(deliveryId, status) {
      const delivery = db.deliveries.find((d) => d.id === deliveryId);
      if (!delivery) throw { status: 404, message: "Delivery not found." };
      delivery.status = status;
      const order = db.orders.find((o) => o.id === delivery.orderId);
      if (order) {
        if (status === "out_for_delivery") order.status = "out_for_delivery";
        if (status === "delivered") order.status = "delivered";
        if (order.status === "out_for_delivery" || order.status === "delivered") {
          const idx = ORDER_LIFECYCLE.indexOf(order.status);
          order.timeline = ORDER_LIFECYCLE.map((s, i) => ({
            status: s,
            at: i <= idx ? (order.timeline[i]?.at ?? todayISO()) : null,
          }));
        }
      }
      return delay({ ...delivery }, 400);
    },
  },

  drivers: {
    async list(query) {
      let items = [...db.drivers];
      if (query.status && query.status !== "all")
        items = items.filter((d) => d.status === query.status);
      if (query.search) {
        const t = query.search.toLowerCase();
        items = items.filter((d) => d.fullName.toLowerCase().includes(t) || d.phone.includes(t));
      }
      return delay(paginate(items, query.page, query.pageSize ?? 20));
    },
    async get(id) {
      const driver = db.drivers.find((d) => d.id === id);
      if (!driver) throw { status: 404, message: "Driver not found." };
      return delay(driver);
    },
    async available() {
      return delay(
        db.drivers
          .filter((d) => d.status === "active")
          .map((d) => ({ ...d, onDuty: d.onDuty ?? d.available })),
      );
    },
    async create(input) {
      const driver: Driver = {
        id: `drv_${Date.now()}`,
        fullName: input.fullName,
        phone: input.phone,
        status: "active",
        todayAssigned: 0,
        activeDeliveries: 0,
        completedDeliveries: 0,
        available: true,
      };
      db.drivers.unshift(driver);
      return delay(driver, 450);
    },
    async update(id, input) {
      const driver = db.drivers.find((d) => d.id === id);
      if (!driver) throw { status: 404, message: "Driver not found." };
      Object.assign(driver, input);
      if (input.status) driver.available = input.status === "active";
      return delay({ ...driver }, 400);
    },
    async deliveriesFor(driverId) {
      return delay(db.deliveries.filter((d) => d.driverId === driverId));
    },
  },

  sales: {
    async report(query): Promise<SalesReport> {
      const now = Date.now();
      const spanDays = query.period === "today" ? 1 : query.period === "week" ? 7 : 30;
      const from = query.from ? +new Date(query.from) : now - spanDays * 86_400_000;
      const to = query.to ? +new Date(query.to) : now;
      const inRange = db.orders.filter((o) => {
        const t = +new Date(o.createdAt);
        return t >= from && t <= to;
      });

      const records: SalesRecord[] = inRange.map((o) => ({
        orderId: o.id,
        date: o.createdAt,
        customer: o.customer.fullName,
        product: o.item.product,
        quantity: o.item.quantity,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        total: o.total,
      }));

      const active = inRange.filter((o) => o.status !== "cancelled");
      const trendBuckets = new Map<string, { sales: number; orders: number }>();
      const buckets = query.period === "today" ? 1 : spanDays;
      for (let i = buckets - 1; i >= 0; i--) {
        const d = new Date(now - i * 86_400_000);
        trendBuckets.set(d.toISOString().slice(0, 10), { sales: 0, orders: 0 });
      }
      for (const o of active) {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        const bucket = trendBuckets.get(key);
        if (bucket) {
          bucket.sales += o.total;
          bucket.orders += 1;
        }
      }

      const statusCounts = new Map<OrderStatus, number>();
      for (const o of inRange) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
      const paymentCounts = new Map<PaymentStatus, number>();
      for (const o of inRange)
        paymentCounts.set(o.paymentStatus, (paymentCounts.get(o.paymentStatus) ?? 0) + 1);

      const byProduct = (product: OrderType) => active.filter((o) => o.item.product === product);

      const report: SalesReport = {
        summary: {
          totalSales: active.reduce((s, o) => s + o.total, 0),
          totalOrders: inRange.length,
          unitsSold: active.reduce((s, o) => s + o.item.quantity, 0),
          firstPurchases: byProduct("first_purchase").length,
          refills: byProduct("refill").length,
          completedOrders: inRange.filter(
            (o) => o.status === "delivered" || o.status === "customer_received",
          ).length,
          cancelledOrders: inRange.filter((o) => o.status === "cancelled").length,
          cashPayments: inRange.filter((o) => o.paymentMethod === "cash").length,
          pendingPayments: inRange.filter((o) => o.paymentStatus === "pending").length,
          deliveryCharges: active.reduce((s, o) => s + o.deliveryCharge, 0),
        },
        trend: [...trendBuckets.entries()].map(([date, v]) => ({ date, ...v })),
        productMix: db.products
          .map((p) => p.code)
          .map((product) => ({
            product,
            label: productLabel(product, db.products.find((p) => p.code === product)?.name),
            orders: byProduct(product).length,
            sales: byProduct(product).reduce((s, o) => s + o.total, 0),
          })),
        statusDistribution: [...statusCounts.entries()].map(([status, count]) => ({
          status,
          count,
        })),
        paymentDistribution: [...paymentCounts.entries()].map(([status, count]) => ({
          status,
          count,
        })),
        records: records.sort((a, b) => +new Date(b.date) - +new Date(a.date)),
      };
      return delay(report, 420);
    },
  },

  pricing: {
    async list() {
      return delay(db.products.filter((p) => p.isActive).map(priceOf));
    },
    async update(product, price, actor) {
      const entry = db.products.find((p) => p.code === product);
      if (!entry) throw { status: 404, message: "Price configuration not found." };
      if (!Number.isFinite(price) || price <= 0) {
        throw { status: 400, message: "Enter a valid price greater than zero." };
      }
      entry.price = Math.round(price);
      entry.updatedAt = todayISO();
      pushAudit({
        actor,
        role: "SALES_MANAGER",
        action: "PRICE_UPDATED",
        entity: "Pricing",
        description: `Changed ${entry.name} price to TZS ${entry.price.toLocaleString("en-US")}.`,
      });
      return delay(priceOf(entry), 450);
    },
  },

  products: {
    async list() {
      return delay(db.products.map((p) => ({ ...p })));
    },
    async create(input) {
      const base =
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 24) || "product";
      let code = base;
      for (let n = 2; db.products.some((p) => p.code === code); n++) code = `${base}_${n}`;
      const product: Product = {
        id: `prd_${Date.now()}`,
        code,
        name: input.name,
        description: input.description ?? "",
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? db.products.length,
        orderCount: 0,
        updatedAt: todayISO(),
      };
      db.products.push(product);
      return delay({ ...product }, 400);
    },
    async update(id, input) {
      const product = db.products.find((p) => p.id === id);
      if (!product) throw { status: 404, message: "Product not found." };
      Object.assign(product, input, { updatedAt: todayISO() });
      return delay({ ...product }, 400);
    },
    async uploadImage(id, file) {
      const product = db.products.find((p) => p.id === id);
      if (!product) throw { status: 404, message: "Product not found." };
      // Demo mode keeps the picture in memory only; it disappears on reload.
      product.imageUrl = URL.createObjectURL(file);
      product.updatedAt = todayISO();
      return delay({ ...product }, 600);
    },
  },

  users: {
    async list(query) {
      const everyone: UserAccount[] = [
        ...seedCustomers.map((c, i): UserAccount => ({
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          email: null,
          role: "USER",
          isActive: true,
          orderCount: db.orders.filter((o) => o.customer.id === c.id).length,
          createdAt: new Date(Date.now() - (i + 3) * 86_400_000).toISOString(),
        })),
        ...db.drivers.map((d, i): UserAccount => ({
          id: d.id,
          fullName: d.fullName,
          phone: d.phone,
          email: null,
          role: "DRIVER",
          isActive: d.status === "active",
          orderCount: 0,
          createdAt: new Date(Date.now() - (i + 20) * 86_400_000).toISOString(),
        })),
        ...db.accounts.map((a): UserAccount => ({
          id: a.id,
          fullName: a.fullName,
          phone: a.phone,
          email: a.email,
          role: a.role,
          isActive: a.status === "active",
          orderCount: 0,
          createdAt: a.createdAt,
        })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const roleCounts: Partial<Record<UserAccount["role"], number>> = {};
      for (const u of everyone) roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
      const term = (query.search ?? "").trim().toLowerCase();
      const rows = everyone.filter(
        (u) =>
          (!query.role || query.role === "all" || u.role === query.role) &&
          (!query.status || query.status === "all" || u.isActive === (query.status === "active")) &&
          (!term || `${u.fullName} ${u.phone} ${u.email ?? ""}`.toLowerCase().includes(term)),
      );
      return delay({ ...paginate(rows, query.page, query.pageSize ?? 25), roleCounts });
    },
    async setActive(id, active) {
      const page = await mockServices.users.list({ page: 1, pageSize: 500 });
      const account = page.items.find((u) => u.id === id);
      if (!account) throw { status: 404, message: "Account not found." };
      const driver = db.drivers.find((d) => d.id === id);
      if (driver) driver.status = active ? "active" : "inactive";
      const staff = db.accounts.find((a) => a.id === id);
      if (staff) staff.status = active ? "active" : "inactive";
      return delay({ ...account, isActive: active }, 300);
    },
    async setPassword() {
      return delay(undefined, 300);
    },
  },

  adminAccounts: {
    async list() {
      return delay(db.accounts.map((a) => ({ ...a })));
    },
    async create(input: CreateAccountInput) {
      const account: AdminAccount = {
        id: `usr_${Date.now()}`,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        role: input.role,
        status: "active",
        createdAt: todayISO(),
        lastLoginAt: null,
      };
      db.accounts.unshift(account);
      pushAudit({
        actor: "System Admin",
        role: "SYSTEM_ADMIN",
        action: "ACCOUNT_CREATED",
        entity: "Admin Account",
        description: `Created ${input.role === "SALES_MANAGER" ? "Sales Manager" : "System Admin"} account for ${input.fullName}.`,
      });
      return delay(account, 500);
    },
    async update(id, input) {
      const account = db.accounts.find((a) => a.id === id);
      if (!account) throw { status: 404, message: "Account not found." };
      Object.assign(account, input);
      return delay({ ...account }, 400);
    },
  },

  settings: {
    async orderOptions() {
      return delay(
        structuredClone({ delivery: db.settings.delivery, payments: db.settings.payments }),
      );
    },
    async get() {
      return delay(structuredClone(db.settings));
    },
    async update(patch) {
      db.settings = { ...db.settings, ...patch } as SystemSettings;
      pushAudit({
        actor: "System Admin",
        role: "SYSTEM_ADMIN",
        action: "SETTING_CHANGED",
        entity: "System Settings",
        description: "Updated system configuration.",
      });
      return delay(structuredClone(db.settings), 450);
    },
  },

  audit: {
    async list(query) {
      let items = [...db.audit];
      if (query.actor) {
        const t = query.actor.toLowerCase();
        items = items.filter((a) => a.actor.toLowerCase().includes(t));
      }
      if (query.action && query.action !== "all")
        items = items.filter((a) => a.action === query.action);
      if (query.entity && query.entity !== "all")
        items = items.filter((a) => a.entity === query.entity);
      if (query.date) items = items.filter((a) => sameDay(a.at, query.date!));
      return delay(paginate(items, query.page, query.pageSize ?? 10));
    },
  },

  notifications: {
    async list(role) {
      return delay(
        db.notifications
          .filter((n) => n.audience.includes(role))
          .map((n) => ({ ...n }) as AppNotification),
      );
    },
    async markRead(id) {
      const item = db.notifications.find((n) => n.id === id);
      if (item) item.read = true;
      await delay(null, 120);
    },
    async markAllRead(role) {
      for (const n of db.notifications) if (n.audience.includes(role)) n.read = true;
      await delay(null, 160);
    },
  },

  operations: {
    async overview() {
      return delay(structuredClone({ ...operations, generatedAt: todayISO() }));
    },
    async handIn(driverId, paymentIds, amountReceived) {
      const entry = operations.cash.find((c) => c.driverId === driverId);
      const receipts = entry?.receipts.filter((r) => paymentIds.includes(r.paymentId)) ?? [];
      if (!entry || receipts.length !== paymentIds.length)
        throw { status: 409, message: "This driver's cash changed. Refresh and count again." };
      const expected = receipts.reduce((sum, r) => sum + r.amount, 0);
      if (expected !== amountReceived)
        throw {
          status: 422,
          message: `You counted ${amountReceived.toLocaleString()} but the receipts add up to ${expected.toLocaleString()}. Count again before confirming.`,
        };
      operations.cash = operations.cash.filter((c) => c.driverId !== driverId);
      pushAudit({
        actor: readSession()?.fullName ?? "Demo",
        role: "SALES_MANAGER",
        action: "CASH_HANDED_IN",
        entity: "user",
        description: `Cash handed in by ${entry.driverName}`,
      });
      return delay({ settled: expected }, 400);
    },
    async reviewFlag(id) {
      operations.flags = operations.flags.filter((f) => f.id !== id);
      await delay(null, 200);
    },
  },
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const operations: OperationsOverview = {
  generatedAt: todayISO(),
  cash: [
    {
      driverId: "drv_001",
      driverName: "Salum Rashid",
      driverPhone: "+255712004411",
      onDuty: true,
      amount: 26000,
      oldestAt: minutesAgo(310),
      receipts: [
        {
          paymentId: "pay_m1",
          orderId: null,
          orderNumber: "NELMA-DEMO-000118",
          customerName: "Neema Mushi",
          area: "Sakina",
          amount: 18000,
          collectedAt: minutesAgo(310),
        },
        {
          paymentId: "pay_m2",
          orderId: null,
          orderNumber: "NELMA-DEMO-000124",
          customerName: "Baraka Temba",
          area: "Njiro",
          amount: 8000,
          collectedAt: minutesAgo(95),
        },
      ],
    },
    {
      driverId: "drv_003",
      driverName: "Hawa Mbwana",
      driverPhone: "+255689223114",
      onDuty: false,
      amount: 4000,
      oldestAt: minutesAgo(1500),
      receipts: [
        {
          paymentId: "pay_m3",
          orderId: null,
          orderNumber: "NELMA-DEMO-000097",
          customerName: "Grace Lema",
          area: "Kijenge",
          amount: 4000,
          collectedAt: minutesAgo(1500),
        },
      ],
    },
  ],
  flags: [
    {
      id: "flag_m1",
      at: minutesAgo(40),
      kinds: ["proof_skipped", "far_from_address"],
      detail:
        "Delivered without the code: customer had no phone. Marked delivered 1,240 m from the saved address",
      driverId: "drv_004",
      driverName: "Frank Lyimo",
      orderId: null,
      orderNumber: "NELMA-DEMO-000131",
      customerName: "Rehema Kweka",
      area: "Themi",
    },
    {
      id: "flag_m2",
      at: minutesAgo(130),
      kinds: ["declined"],
      detail: "Declined: Vehicle problem (flat tyre)",
      driverId: "drv_002",
      driverName: "Joseph Mnyika",
      orderId: null,
      orderNumber: "NELMA-DEMO-000129",
      customerName: "Daudi Shirima",
      area: "Olasiti",
    },
    {
      id: "flag_m3",
      at: minutesAgo(600),
      kinds: ["delivery_issue"],
      detail: "Customer not answering",
      driverId: "drv_001",
      driverName: "Salum Rashid",
      orderId: null,
      orderNumber: "NELMA-DEMO-000102",
      customerName: "Upendo Massawe",
      area: "Sanawari",
    },
  ],
  stalled: [
    {
      kind: "not_accepted",
      since: minutesAgo(52),
      driverId: "drv_006",
      driverName: "Elias Sanga",
      scheduledDate: todayISO().slice(0, 10),
      timeWindow: "12:00 - 16:00",
      orderId: null,
      orderNumber: "NELMA-DEMO-000133",
      customerName: "Janeth Mollel",
      area: "Ngarenaro",
    },
    {
      kind: "driver_off_duty",
      since: minutesAgo(180),
      driverId: "drv_004",
      driverName: "Frank Lyimo",
      scheduledDate: todayISO().slice(0, 10),
      timeWindow: "16:00 - 19:00",
      orderId: null,
      orderNumber: "NELMA-DEMO-000127",
      customerName: "Said Mfinanga",
      area: "Moshono",
    },
  ],
  drivers: [
    {
      driverId: "drv_001",
      driverName: "Salum Rashid",
      driverPhone: "+255712004411",
      onTheRoad: 1,
      waiting: 1,
      lastLocation: { latitude: -3.3731, longitude: 36.6937, at: minutesAgo(1) },
    },
    {
      driverId: "drv_006",
      driverName: "Elias Sanga",
      driverPhone: "+255783551209",
      onTheRoad: 0,
      waiting: 1,
      lastLocation: { latitude: -3.3869, longitude: 36.7123, at: minutesAgo(26) },
    },
    {
      driverId: "drv_002",
      driverName: "Joseph Mnyika",
      driverPhone: "+255754110982",
      onTheRoad: 0,
      waiting: 0,
      lastLocation: null,
    },
  ],
};

async function advance(id: string, from: OrderStatus, to: OrderStatus): Promise<Order> {
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw { status: 404, message: "This order could not be found." };
  if (order.status !== from) {
    throw { status: 409, message: "This order is no longer in the expected state." };
  }
  order.status = to;
  const idx = ORDER_LIFECYCLE.indexOf(to);
  order.timeline = ORDER_LIFECYCLE.map((s, i) => ({
    status: s,
    at: i <= idx ? (order.timeline[i]?.at ?? todayISO()) : null,
  }));
  return delay({ ...order }, 450);
}

export type { PriceConfiguration, Delivery, AdminAccount };
