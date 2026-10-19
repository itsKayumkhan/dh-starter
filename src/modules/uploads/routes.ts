import { ROUTES } from "@/lib/constants/routes";

export const UPLOAD_ROUTES = {
  media: `${ROUTES.admin}/media`,
  sign: `${ROUTES.api}/uploads/sign`,
  list: `${ROUTES.api}/uploads/media`,
} as const;
