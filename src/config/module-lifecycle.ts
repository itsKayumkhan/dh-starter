import { onUserDelete as billingUserDelete } from "@/modules/billing/lifecycle"; // module:billing
import { onUserDelete as notificationsUserDelete } from "@/modules/notifications/lifecycle"; // module:notifications

export const userDeleteHooks: Array<(userId: string) => Promise<void>> = [
  billingUserDelete, // module:billing
  notificationsUserDelete, // module:notifications
];
