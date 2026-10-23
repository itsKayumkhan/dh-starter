export const CMS_ROUTES = {
  settings: "/admin/cms/settings",
  content: "/admin/cms/content",
  block: (key: string) => `/admin/cms/content/${encodeURIComponent(key)}`,
} as const;
