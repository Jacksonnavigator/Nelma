import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { navigationFor } from "@/lib/nav";
import { can } from "@/lib/permissions";

describe("refined interface foundations", () => {
  it("provides one semantic page heading with supporting copy", () => {
    const html = renderToStaticMarkup(
      createElement(PageHeader, { title: "Orders", description: "Customer orders" }),
    );
    expect(html).toContain("<h1");
    expect(html).toContain("Customer orders");
  });
  it("retains full metric values rather than truncating them", () => {
    const html = renderToStaticMarkup(
      createElement(StatCard, { label: "Sales", value: "TZS 123,456,789" }),
    );
    expect(html).toContain("TZS 123,456,789");
    expect(html).not.toContain("truncate");
  });
  it("uses a skeleton rather than showing a false zero while loading", () => {
    const html = renderToStaticMarkup(
      createElement(StatCard, { label: "Sales", value: 0, loading: true }),
    );
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain(">0<");
  });
  it("gives status a text label, not color alone", () => {
    const html = renderToStaticMarkup(
      createElement(StatusBadge, { kind: "payment", status: "paid" }),
    );
    expect(html).toContain("Paid");
    expect(html).toContain('aria-hidden="true"');
  });
  it("retains the role-restricted navigation and unique destinations", () => {
    for (const role of ["SYSTEM_ADMIN", "SALES_MANAGER"] as const) {
      const items = navigationFor(role).filter((item) => can(role, item.permission));
      expect(new Set(items.map((item) => item.to)).size).toBe(items.length);
      expect(items.some((item) => item.to === "/dashboard")).toBe(true);
    }
    expect(navigationFor("SYSTEM_ADMIN").some((item) => item.to === "/create-order")).toBe(false);
    expect(can("SYSTEM_ADMIN", "orders.create")).toBe(false);
  });
});
