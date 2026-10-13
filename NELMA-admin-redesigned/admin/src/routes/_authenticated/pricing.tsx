import { createFileRoute, redirect } from "@tanstack/react-router";

// Prices are edited with the rest of each product now; keep old links and bookmarks working.
export const Route = createFileRoute("/_authenticated/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/products" });
  },
});
