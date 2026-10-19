import { APP_URL } from "@/lib/env/client";

export const site = {
  name: "DH Starter",
  url: APP_URL,
  description: "A reusable foundation for Digital Heroes projects.",
  locale: "en-US",
  timeZone: "UTC",
  logo: "/logo.svg",
  colors: {
    primary: "#0f172a",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#64748b",
  },
  supportEmail: "support@dhstarter.test",
  address: "Digital Heroes, Your business address",
  social: { website: APP_URL, instagram: "", linkedin: "", x: "" },
} as const;
