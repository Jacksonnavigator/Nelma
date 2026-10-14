import "./lib/error-capture";
import { createCspNonce, hardenResponse } from "./lib/security-headers";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (
    request: Request,
    options?: { context?: { nonce: string } },
  ) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request) {
    const production = import.meta.env.PROD;
    const nonce = production ? createCspNonce() : undefined;
    // Overwrite rather than trust a client-provided header. Request-scoped only.
    const headers = new Headers(request.headers);
    headers.delete("x-nelma-csp-nonce");
    if (nonce) headers.set("x-nelma-csp-nonce", nonce);
    // Nitro's Node adapter may wrap Request in a proxy. Passing that object
    // into undici's Request constructor fails its private-slot check.
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      signal: request.signal,
      ...(request.method === "GET" || request.method === "HEAD"
        ? {}
        : { body: request.body, duplex: "half" as const }),
    };
    const internalRequest = new Request(request.url, init);
    const finish = (response: Response) =>
      nonce
        ? hardenResponse(response, request.url, nonce, import.meta.env["VITE_API_URL"] || "/api/v1")
        : response;
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(
        internalRequest,
        nonce ? { context: { nonce } } : undefined,
      );
      return finish(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return finish(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
