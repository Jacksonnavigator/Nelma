/// <reference types="node" />
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createElement, type ComponentType } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({ secure: new Map<string, string>(), local: new Map<string, string>(), replace: vi.fn(), secureAvailable: true }));
vi.mock("expo-secure-store", () => ({
  isAvailableAsync: async () => native.secureAvailable,
  getItemAsync: async (key: string) => native.secure.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => { native.secure.set(key, value); },
  deleteItemAsync: async (key: string) => { native.secure.delete(key); }
}));
vi.mock("@react-native-async-storage/async-storage", () => ({ default: {
  getItem: async (key: string) => native.local.get(key) ?? null,
  setItem: async (key: string, value: string) => { native.local.set(key, value); },
  removeItem: async (key: string) => { native.local.delete(key); }
} }));
vi.mock("expo-notifications", () => ({ addNotificationResponseReceivedListener: () => ({ remove: vi.fn() }) }));
vi.mock("react-native-safe-area-context", () => ({ initialWindowMetrics: null, useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }), SafeAreaProvider: ({ children }: { children: import("react").ReactNode }) => children }));
vi.mock("../store/network-context", () => ({ NetworkProvider: ({ children }: { children: import("react").ReactNode }) => children }));
vi.mock("../services/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("react-native", () => ({
  View: "view", Text: "text", Pressable: "pressable", StyleSheet: { create: (styles: unknown) => styles }, Platform: { OS: "android", select: (values: Record<string, unknown>) => values.android ?? values.default },
  AppState: { addEventListener: () => ({ remove: () => undefined }) }
}));
vi.mock("../services/haptics", () => ({ haptics: { light: vi.fn(), success: vi.fn(), selection: vi.fn() } }));
vi.mock("../services/location", () => ({ locationService: { getCurrentCoordinates: vi.fn() } }));
vi.mock("../components", () => ({
  LoadingScreen: () => createElement("loading"),
  BrandMark: () => null,
  Input: (props: object) => createElement("input", props), PasswordInput: (props: object) => createElement("input", props),
  Button: (props: object) => createElement("button", props), ServiceAreaMap: (props: object) => createElement("map", props),
  Screen: ({ children }: { children: import("react").ReactNode }) => createElement("screen", null, children)
}));
vi.mock("../hooks/use-translation", () => ({ useTranslation: () => ({ t: (value: string) => value }) }));
vi.mock("lucide-react-native", () => ({ Home: () => null, ReceiptText: () => null, User: () => null, Bell: () => null, Clock3: () => null, Truck: () => null, Check: () => null, Languages: () => null, LocateFixed: () => null, MapPin: () => null, Navigation: () => null, UserPlus: () => null, LogIn: () => null }));
vi.mock("expo-router", () => {
  const Tabs = Object.assign(() => createElement("tabs"), { Screen: () => null });
  return { router: { replace: native.replace }, Link: "link", Redirect: ({ href }: { href: string }) => createElement("redirect", { href }), Tabs, Stack: () => createElement("stack") };
});

type AuthValue = ReturnType<typeof import("../store/auth-context").useAuth>;
let current: AuthValue;
let renderer: ReactTestRenderer | undefined;
let server: ChildProcess;
let auth: typeof import("../store/auth-context");
let landing: typeof import("../utils/role-routing").mobileLandingForUser;
let storage: typeof import("../storage/secure-token-storage").secureTokenStorage;
let guards: { index: ComponentType; auth: ComponentType; customer: ComponentType; driver: ComponentType; driverTabs: ComponentType };
let baseUrl: string;

let SessionProviders: typeof import("../store/app-providers").SessionProviders;
let accountHooks: {
  useOrders: typeof import("../store/order-context").useOrders;
  useNotifications: typeof import("../store/notification-context").useNotifications;
};
let account: {
  orders: ReturnType<typeof accountHooks.useOrders>;
  notifications: ReturnType<typeof accountHooks.useNotifications>;
};
function Probe() {
  current = auth.useAuth();
  account = { orders: accountHooks.useOrders(), notifications: accountHooks.useNotifications() };
  return null;
}
function Harness({ children }: { children?: import("react").ReactNode }) {
  return createElement(auth.AuthProvider, null, createElement(SessionProviders, null, createElement(Probe), children));
}
async function mount() {
  await act(async () => { renderer = create(createElement(Harness)); });
  await vi.waitFor(async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); }); expect(current.status).not.toBe("loading"); }, { timeout: 5000 });
}
async function unmount() {
  await act(async () => { renderer?.unmount(); });
  renderer = undefined;
}
async function assertGuard(Component: ComponentType, expected: string) {
  await act(async () => { renderer!.update(createElement(Harness, null, createElement(Component))); });
  const tree = renderer!.toJSON() as { type: string; props: { href?: string } };
  expect(tree?.type === "redirect" ? tree.props.href : tree?.type).toBe(expected);
}
async function assertSurface(role: "USER" | "DRIVER") {
  const route = role === "DRIVER" ? "/driver/(tabs)/deliveries" : "/(tabs)/home";
  expect(current.user?.role).toBe(role);
  expect(landing(current.user)).toBe(route);
  await assertGuard(guards.index, route);
  await assertGuard(guards.auth, route);
  await assertGuard(guards.customer, role === "DRIVER" ? route : "tabs");
  await assertGuard(guards.driver, role === "DRIVER" ? "stack" : route);
  await assertGuard(guards.driverTabs, role === "DRIVER" ? "tabs" : route);
}

beforeAll(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  server = spawn(process.env.PYTHON ?? "python", ["-u", "-m", "tests.mobile_trace_server"], { cwd: "../backend", stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  const port = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Trace backend did not start")), 45000);
    server.once("error", reject);
    server.once("exit", () => reject(new Error("Trace backend exited before startup")));
    server.stdout!.on("data", (data) => {
      const match = String(data).match(/TRACE_PORT=(\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    server.stderr!.on("data", () => { /* Do not forward server output containing request data. */ });
  });
  baseUrl = "http://127.0.0.1:" + port + "/api/v1";
  await vi.waitFor(async () => { expect((await fetch(baseUrl + "/health")).ok).toBe(true); }, { timeout: 10000 });
  vi.stubEnv("EXPO_PUBLIC_API_URL", baseUrl);
  vi.stubEnv("EXPO_PUBLIC_USE_MOCKS", "false");
  auth = await import("../store/auth-context");
  SessionProviders = (await import("../store/app-providers")).SessionProviders;
  accountHooks = {
    useOrders: (await import("../store/order-context")).useOrders,
    useNotifications: (await import("../store/notification-context")).useNotifications
  };
  landing = (await import("../utils/role-routing")).mobileLandingForUser;
  storage = (await import("../storage/secure-token-storage")).secureTokenStorage;
  guards = {
    index: (await import("../app/index")).default,
    auth: (await import("../app/(auth)/_layout")).default,
    customer: (await import("../app/(tabs)/_layout")).default,
    driver: (await import("../app/driver/_layout")).default,
    driverTabs: (await import("../app/driver/(tabs)/_layout")).default
  };
}, 60000);

afterAll(async () => {
  await unmount();
  if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; }
  vi.unstubAllEnvs();
});

describe("real FastAPI repository through AuthProvider and rendered route guards", () => {
  it("reproduces the old mock collision without contacting the backend", async () => {
    const { mockRepositories } = await import("../repositories/mock");
    const session = await mockRepositories.auth.login({ identifier: "driver@trace.example.com", password: "IgnoredPassword123" });
    expect(session.user.role).toBe("USER");
    expect(landing(session.user)).toBe("/(tabs)/home");
    console.log("BEFORE: mock login -> backend request absent -> USER -> /(tabs)/home");
  });

  it("switches USER -> DRIVER -> USER, restores both roles and refreshes a DRIVER session", async () => {
    const { repositories } = await import("../repositories");
    const { apiRepositories } = await import("../repositories/api");
    expect(repositories).toBe(apiRepositories);
    // Existing local USER data must not replace a real API identity.
    expect(native.local.has("nelma.mock.user")).toBe(true);
    await mount();
    expect(current.status).toBe("unauthenticated");
    for (const role of ["USER", "DRIVER", "USER"] as const) {
      let returned: AuthValue["user"] = null;
      await act(async () => { returned = await current.login({ identifier: role.toLowerCase() + "@trace.example.com", password: "TracePassword123" }); });
      expect(returned).toEqual(current.user);
      const tokens = await storage.get();
      expect(tokens?.audience).toBe("mobile");
      for (const token of [tokens!.accessToken, tokens!.refreshToken]) {
        const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
        expect(claims.aud).toBe("mobile");
        expect(claims.role).toBeUndefined();
      }
      await assertSurface(role);
      if (role === "DRIVER") console.log("DRIVER backend user (test fixture):", JSON.stringify(current.user));
      console.log("AFTER: API login -> " + role + " / mobile -> auth store " + current.user?.role + " -> " + landing(current.user));
      // Remount the actual provider, preserving only simulated secure storage.
      await unmount();
      if (role === "DRIVER") native.secure.set("nelma.accessToken", "expired-test-access-token");
      await mount();
      await assertSurface(role);
      console.log("RESTORE: " + role + " -> /users/me" + (role === "DRIVER" ? " -> 401 -> refresh -> /users/me" : "") + " -> " + landing(current.user));
      const beforeLogout = await storage.get();
      await act(async () => { await current.logout(); });
      expect(current.user).toBeNull();
      expect(current.status).toBe("unauthenticated");
      expect(native.secure.size).toBe(0);
      const revoked = await fetch(baseUrl + "/auth/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: beforeLogout!.refreshToken }) });
      expect(revoked.status).toBe(401);
    }
  }, 30000);
});

async function showScreen(Component: ComponentType) {
  await act(async () => { renderer!.update(createElement(Harness, null, createElement(Component))); });
}
async function typeField(label: string, value: string, perCharacter = false) {
  for (const text of perCharacter ? Array.from(value, (_, i) => value.slice(0, i + 1)) : [value]) {
    await act(async () => { renderer!.root.findAllByType("input").find((field) => field.props.label === label)!.props.onChangeText(text); });
  }
}
async function press(title: string) {
  await act(async () => { await renderer!.root.findAllByType("button").find((button) => button.props.title === title)!.props.onPress(); });
}

describe("USER registration screen against real FastAPI", () => {
  it("registers with a phone typed character by character, then logs in USER -> DRIVER -> USER", async () => {
    await unmount();
    await storage.clear();
    await mount();
    const RegisterScreen = (await import("../app/(auth)/register")).default;
    await showScreen(RegisterScreen);
    await typeField("Full name", "New Mobile Customer");
    await typeField("Phone number", "0710000003", true);
    await typeField("Email", "new-mobile@trace.example.com");
    await typeField("Full Address", "Arusha Block C");
    await typeField("Area", "NM-AIST");
    await act(async () => { renderer!.root.findByType("map").props.onPickCoordinate({ latitude: -3.3996, longitude: 36.7959 }); });
    await typeField("Password", "TracePassword123");
    await typeField("Confirm password", "TracePassword123");
    const requestSpy = vi.spyOn(globalThis, "fetch");
    await press("Create Account");
    const registrationRequest = requestSpy.mock.calls.find(([url]) => String(url).endsWith("/auth/register"));
    requestSpy.mockRestore();
    expect(registrationRequest).toBeDefined();
    const sent = JSON.parse(String(registrationRequest![1]?.body));
    expect(Object.keys(sent).sort()).toEqual(["fullName", "phone", "email", "password", "confirmPassword", "preferredLanguage", "addressLocationPreference", "signupAddress"].sort());
    expect(sent.signupAddress.phone).toBe("0710000003");
    expect(current.status).toBe("authenticated");
    expect(current.user?.role).toBe("USER");
    expect(current.user?.phone).toBe("+255710000003");
    expect(native.replace).toHaveBeenLastCalledWith("/(tabs)/home");
    await assertSurface("USER");
    console.log("REGISTER screen -> real POST /auth/register -> USER/mobile -> auth store USER -> customer Home");
    const { repositories } = await import("../repositories");
    const addresses = await repositories.addresses.list();
    expect(addresses[0].phone).toBe("+255710000003");
    const LoginScreen = (await import("../app/(auth)/login")).default;
    for (const [identifier, role] of [["0710000003", "USER"], ["driver@trace.example.com", "DRIVER"], ["new-mobile@trace.example.com", "USER"]] as const) {
      await act(async () => { await current.logout(); });
      expect(native.secure.size).toBe(0);
      expect(current.user).toBeNull();
      await showScreen(LoginScreen);
      await typeField("Phone or email", identifier);
      await typeField("Password", "TracePassword123");
      await press("Sign In");
      expect(current.user?.role).toBe(role);
      expect(native.replace).toHaveBeenLastCalledWith(landing(current.user));
      await assertSurface(role);
      console.log("LOGIN screen -> real POST /auth/login -> store " + role + " -> " + landing(current.user));
    }
    await act(async () => { await current.logout(); });
  }, 30000);
});

describe("USER input and session regression cases over real HTTP", () => {
  it("accepts optional blank email and preserves a separately entered delivery phone", async () => {
    await unmount(); await storage.clear(); await mount();
    await showScreen((await import("../app/(auth)/register")).default);
    await typeField("Full name", "Phone Only Customer");
    await typeField("Phone number", "0710000004", true);
    await typeField("Email", "   ");
    await typeField("Delivery phone", "0710000005");
    await typeField("Phone number", "0710000006", true);
    await typeField("Full Address", "Arusha Block C");
    await typeField("Area", "NM-AIST");
    await act(async () => { renderer!.root.findByType("map").props.onPickCoordinate({ latitude: -3.3996, longitude: 36.7959 }); });
    await typeField("Password", "TracePassword123"); await typeField("Confirm password", "TracePassword123");
    await press("Create Account");
    expect(current.user?.role).toBe("USER"); expect(current.user?.email).toBeNull();
    const { repositories } = await import("../repositories");
    expect((await repositories.addresses.list())[0].phone).toBe("+255710000005");
    await act(async () => { await current.logout(); });
    for (const identifier of ["0710000006", "710000006", "+255 710 000 006", "00255 (710) 000-006"]) {
      await showScreen((await import("../app/(auth)/login")).default);
      await typeField("Phone or email", identifier); await typeField("Password", "TracePassword123"); await press("Sign In");
      expect(current.user?.role).toBe("USER"); await act(async () => { await current.logout(); });
    }
  }, 30000);

  it("shows incorrect credentials, duplicate phone, schema and local-validation errors", async () => {
    await showScreen((await import("../app/(auth)/login")).default);
    await typeField("Phone or email", "user@trace.example.com");
    await typeField("Password", "WrongPassword123"); await press("Sign In");
    expect(current.status).toBe("unauthenticated");
    expect(current.error).toBe("Phone/email or password is incorrect.");
    expect(renderer!.root.findByProps({ accessibilityRole: "alert" }).children.join("")).toContain("incorrect");
    const { repositories } = await import("../repositories");
    const payload = { fullName: "Test User", phone: "0710000001", email: "", password: "TracePassword123", confirmPassword: "TracePassword123" };
    await expect(repositories.auth.register(payload)).rejects.toMatchObject({ code: "PHONE_ALREADY_EXISTS", status: 409 });
    await expect(repositories.auth.register({ ...payload, phone: "0710000007", fullName: "A" })).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 422, message: expect.stringContaining("fullName") });
    await expect(repositories.auth.register({ ...payload, phone: "0710000007", confirmPassword: "DifferentPassword123" })).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 422, message: expect.stringContaining("Passwords must match") });
    await showScreen((await import("../app/(auth)/register")).default);
    await press("Create Account");
    expect(renderer!.root.findByProps({ accessibilityRole: "alert" }).children.join("")).toContain("full name");
  });

  it("clears account-owned caches and rejects a late DRIVER profile response after USER login", async () => {
    await act(async () => { await current.login({ identifier: "driver@trace.example.com", password: "TracePassword123" }); });
    await act(async () => { account.orders.setQuantity(9); });
    expect(account.orders.draft.quantity).toBe(9);
    const realFetch = globalThis.fetch;
    let release!: () => void; let reached!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { reached = resolve; });
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const response = await realFetch(input, init);
      if (String(input).endsWith("/users/me")) { reached(); await held; }
      return response;
    });
    const oldProfile = current.refreshUser().catch((error: { code: string }) => error.code);
    try {
      await started;
      await act(async () => { await current.logout(); });
      expect(account.orders.draft.quantity).toBe(1);
      expect(account.orders.savedAddresses).toEqual([]); expect(account.notifications.notifications).toEqual([]);
      await act(async () => { await current.login({ identifier: "new-mobile@trace.example.com", password: "TracePassword123" }); });
      await act(async () => { release(); expect(await oldProfile).toBe("SESSION_CHANGED"); });
      await assertSurface("USER");
      await act(async () => { await account.orders.loadOrders(); });
      expect(account.orders.savedAddresses[0].phone).toBe("+255710000003");
      await act(async () => { await current.logout(); });
      expect(account.orders.savedAddresses).toEqual([]);
    } finally { release(); spy.mockRestore(); }
  });

  it("does not restore old DRIVER tokens when an in-flight refresh finishes after USER login", async () => {
    await act(async () => { await current.login({ identifier: "driver@trace.example.com", password: "TracePassword123" }); });
    native.secure.set("nelma.accessToken", "expired-test-token");
    const realFetch = globalThis.fetch;
    let release!: () => void; let reached!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { reached = resolve; });
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const response = await realFetch(input, init);
      if (String(input).endsWith("/auth/refresh")) { reached(); await held; }
      return response;
    });
    const oldProfile = current.refreshUser().catch((error: { code: string }) => error.code);
    try {
      await started;
      await act(async () => { await current.logout(); await current.login({ identifier: "user@trace.example.com", password: "TracePassword123" }); });
      const userTokens = await storage.get();
      await act(async () => { release(); expect(await oldProfile).toBe("SESSION_CHANGED"); });
      expect(await storage.get()).toEqual(userTokens);
      await assertSurface("USER");
      await act(async () => { await current.logout(); });
    } finally { release(); spy.mockRestore(); }
  });
});


describe("runtime without native SecureStore", () => {
  it("retains tokens for protected requests and refresh, and clears them on logout", async () => {
    await unmount(); await storage.clear();
    native.secureAvailable = false;
    try {
      await mount();
      await act(async () => { await current.login({ identifier: "user@trace.example.com", password: "TracePassword123" }); });
      expect(await storage.getAccessToken()).toBeTruthy();
      await act(async () => { await current.refreshUser(); await account.orders.loadOrders(); });
      expect(current.status).toBe("authenticated");
      expect(account.orders.status).toBe("success");
      const tokens = (await storage.get())!;
      await storage.save({ ...tokens, accessToken: "expired-test-token" });
      await act(async () => { await current.refreshUser(); });
      expect(current.status).toBe("authenticated");
      expect((await storage.get())?.accessToken).not.toBe("expired-test-token");
      expect(native.secure.size).toBe(0);
      await act(async () => { await current.logout(); });
      expect(await storage.get()).toBeNull();
      expect(await storage.getAccessToken()).toBeNull();
      expect(current.status).toBe("unauthenticated");
    } finally { await storage.clear(); native.secureAvailable = true; }
  }, 30000);
});
