import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { isApiError } from "@/services/api";
import { routeTree } from "./routeTree.gen";

const requestNonce = createIsomorphicFn()
  .server(() => getRequestHeader("x-nelma-csp-nonce"))
  .client(() => undefined);

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // The HTTP client owns one bounded read retry; never retry denials here.
        retry: (failures, error) => failures < 1 && (!isApiError(error) || error.status >= 500),
        gcTime: 5 * 60 * 1000,
      },
      mutations: { retry: false },
    },
  });

  const nonce = requestNonce();
  const router = createRouter({
    routeTree,
    ssr: nonce ? { nonce } : {},
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
