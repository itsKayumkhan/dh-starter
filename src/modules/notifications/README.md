# In-app notifications

Register `notificationsModule` in `src/config/modules.ts` using the normal `// module:notifications` import and array markers. Generate the Prisma client, create a migration for `prisma/schema/notifications.prisma`, and apply it before using the module.

The dashboard notification page lists a signed-in user's items with read filters and pagination. The header bell polls the authenticated summary route every 60 seconds and refreshes on focus. Staff and admin users with `notifications:send` can send to one user, a role, or all non-banned users from the admin page.

Server code can call `notify(userIds, { type, title, body, href? }, { email?: boolean })`. It validates local links, deduplicates user IDs, creates notifications in chunks of 500, optionally sends the core branded email template, and returns delivery counts. Email failures are logged and counted without removing the in-app item.

Env keys: none beyond the core database, auth, and optional email provider settings. `module.json` owns the module, Prisma schema, API route, dashboard and admin routes, and its e2e spec. Remove it with the repository module removal command, then create a migration to drop its table.

For e2e verification, provide a local database and Better Auth URL, apply migrations, and seed the documented test accounts. The e2e test does not run without those prerequisites.
