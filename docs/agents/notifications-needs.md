# Notifications integration needs

The lead must register the module in `src/config/modules.ts`. Add the import and array entry with removal markers:

```ts
import { notificationsModule } from "@/modules/notifications/module"; // module:notifications

export const installedModules: AppModule[] = [
  notificationsModule, // module:notifications
];
```

Preserve existing module entries when inserting. The shell agent has already added `AppModule.HeaderItem`, which `notificationsModule` uses for the bell.

Apply a Prisma migration for `prisma/schema/notifications.prisma` after all modules are integrated. This agent did not run migrations under the shared work rules.
