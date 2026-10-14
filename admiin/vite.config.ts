import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";
import { fileURLToPath } from "node:url";
import { resolveDataMode, validateApiBase } from "./src/lib/security-config";

const releaseGuard: Plugin = {
  name: "nelma-secure-release",
  config(_config, env) {
    if (env.command !== "build") return undefined;
    const publicEnv = loadEnv(env.mode, process.cwd(), "VITE_");
    const allowed = new Set(["VITE_API_URL", "VITE_DATA_MODE"]);
    if (Object.keys(publicEnv).some((key) => !allowed.has(key)))
      throw new Error(
        "Unapproved VITE_* configuration found. Browser variables are public; remove unapproved values before building.",
      );
    const mode = resolveDataMode(publicEnv["VITE_DATA_MODE"]);
    if (mode === "mock") {
      if (process.env["NELMA_ALLOW_DEMO_BUILD"] !== "true")
        throw new Error(
          "Demo builds are blocked. For a labelled local demo only, set NELMA_ALLOW_DEMO_BUILD=true. Never deploy demo mode as a staff system.",
        );
    } else {
      validateApiBase(publicEnv["VITE_API_URL"] ?? "", true);
      return {
        resolve: {
          alias: [
            {
              find: "@/services/mock",
              replacement: fileURLToPath(
                new URL("./src/services/mock-disabled.ts", import.meta.url),
              ),
            },
          ],
        },
      };
    }
    return undefined;
  },
};

export default defineConfig({
  // Keep the preset's existing React/Start/Nitro plugins; do not duplicate them.
  plugins: [releaseGuard],
  envDefine: false,
  vite: { build: { sourcemap: false }, server: { host: "127.0.0.1", cors: false } },
  tanstackStart: { server: { entry: "server" } },
});
