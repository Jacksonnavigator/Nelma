import type { ServiceRegistry } from "./contracts";
// Release-time replacement: no demo accounts or records belong in API assets.
export const mockServices = new Proxy({} as ServiceRegistry, {
  get() {
    throw new Error("Demo services are unavailable in API releases.");
  },
});
