import { describe, expect, it } from "vitest";
import { formatMoney } from "@/modules/billing/format";
import { billingPlans, findPlan, isConfiguredPrice, planIdFromPrice } from "@/modules/billing/plans";

describe("billing plan selection", () => {
  it("maps known Stripe prices to local plans", () => {
    expect(findPlan(billingPlans[0].id)).toBe(billingPlans[0]);
    expect(planIdFromPrice(billingPlans[1].stripePriceId)).toBe(billingPlans[1].id);
    expect(planIdFromPrice("price_unknown")).toBe("unknown");
  });

  it("rejects placeholder and malformed prices before checkout", () => {
    expect(isConfiguredPrice("price_REPLACE_STARTER_MONTHLY")).toBe(false);
    expect(isConfiguredPrice("prod_123")).toBe(false);
    expect(isConfiguredPrice("price_live_123")).toBe(true);
  });
});

describe("minor unit display", () => {
  it("uses the currency fraction digit count", () => {
    expect(formatMoney(1299, "usd")).toBe("$12.99");
    expect(formatMoney(1299, "jpy")).toBe("¥1,299");
    expect(formatMoney(1234, "kwd")).toContain("1.234");
  });
});
