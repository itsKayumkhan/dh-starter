export const CONTACT_ROUTES = {
  contact: "/contact",
  inquiries: "/admin/inquiries",
  inquiry: (id: string) => `/admin/inquiries/${encodeURIComponent(id)}`,
} as const;
