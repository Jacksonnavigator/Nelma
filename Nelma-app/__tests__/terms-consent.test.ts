import { beforeEach, describe, expect, it, vi } from "vitest";

const disk = vi.hoisted(() => ({ values: new Map<string, string>(), failRead: false }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => {
      if (disk.failRead) throw new Error("storage unavailable");
      return disk.values.get(key) ?? null;
    },
    setItem: async (key: string, value: string) => { disk.values.set(key, value); },
    removeItem: async (key: string) => { disk.values.delete(key); }
  }
}));

// The store keeps one shared answer per app run, so every test starts from a fresh copy of it.
const freshStore = async () => {
  vi.resetModules();
  return import("../store/terms-consent");
};
const waitFor = async (check: () => boolean) => {
  for (let i = 0; i < 20 && !check(); i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("terms consent", () => {
  beforeEach(() => {
    disk.values.clear();
    disk.failRead = false;
  });

  it("asks a new user to agree, then remembers the agreement for this version", async () => {
    const { termsConsent, TERMS_KEY } = await freshStore();
    const { TERMS_VERSION } = await import("../constants/terms");
    expect(termsConsent.get()).toBe("loading");
    await termsConsent.accept();
    expect(termsConsent.get()).toBe("accepted");
    expect(JSON.parse(disk.values.get(TERMS_KEY) ?? "{}").version).toBe(TERMS_VERSION);
  });

  it("asks again when the terms version has changed since the person agreed", async () => {
    const { TERMS_KEY } = await freshStore();
    disk.values.set(TERMS_KEY, JSON.stringify({ version: "1999-01-01", acceptedAt: "1999-01-01T00:00:00.000Z" }));
    const react = await import("react-test-renderer");
    const { useTermsConsent } = await import("../store/terms-consent");
    let seen = "";
    const Probe = () => { seen = useTermsConsent().status; return null; };
    const { createElement } = await import("react");
    await react.act(async () => { react.create(createElement(Probe)); await waitFor(() => seen === "needed"); });
    expect(seen).toBe("needed");
  });

  it("never assumes agreement when the phone's storage cannot be read", async () => {
    await freshStore();
    disk.failRead = true;
    const react = await import("react-test-renderer");
    const { useTermsConsent } = await import("../store/terms-consent");
    let seen = "";
    const Probe = () => { seen = useTermsConsent().status; return null; };
    const { createElement } = await import("react");
    await react.act(async () => { react.create(createElement(Probe)); await waitFor(() => seen === "needed"); });
    expect(seen).toBe("needed");
  });

  it("is accepted straight away when this version was already agreed to", async () => {
    const { TERMS_KEY } = await freshStore();
    const { TERMS_VERSION } = await import("../constants/terms");
    disk.values.set(TERMS_KEY, JSON.stringify({ version: TERMS_VERSION, acceptedAt: "2026-10-19T00:00:00.000Z" }));
    const react = await import("react-test-renderer");
    const { useTermsConsent } = await import("../store/terms-consent");
    let seen = "";
    const Probe = () => { seen = useTermsConsent().status; return null; };
    const { createElement } = await import("react");
    await react.act(async () => { react.create(createElement(Probe)); await waitFor(() => seen === "accepted"); });
    expect(seen).toBe("accepted");
  });
});
