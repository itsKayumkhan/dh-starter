# Foundation delivery

## Files created and changed

- Prisma: `prisma.config.ts`, split schemas in `prisma/schema/`, `prisma/seed.mts`, and `docker-compose.yml`.
- Environment and shared core: `src/lib/env/`, `src/lib/db.ts`, auth, action results, safe actions, rate limiting, request IP, audit, logger, SEO, constants, errors, and site and module config.
- Email: provider map and Resend, SMTP, console senders, plus five React Email templates and a branded layout.
- App: auth route handler, proxy, marketing home, login and signup forms, protected dashboard and admin shell, metadata files, error states, and shared providers.
- Tooling and docs: module scripts, README, module guide, production checklist, Prettier, Vitest, Playwright smoke test, CI, and Husky hook.
- Updated `package.json` scripts and `lint-staged` only. Fixed an existing React hook lint error in `src/hooks/use-mobile.ts`.

## Core contracts

Key callable signatures from the source:

```ts
getServerEnv(): z.infer<typeof serverEnvSchema>
isGoogleAuthEnabled(): boolean
can(user: { role?: string | null; banned?: boolean | null } | null, permission: Permission): boolean
requireUser(next?: string)
assertUser()
requireRole(roles: readonly Role[])
requirePermission(permission: Permission)
assertPermission(permission: Permission)
ok<T>(data: T): ActionResult<T>
fail<T = never>(error: string, fieldErrors?: Record<string, string[]>): ActionResult<T>
fromZodError(error: z.ZodError): Record<string, string[]>
safeAction<S extends z.ZodType, T>(options: Options<S>, handler: (input: z.output<S>, ctx: { user: Awaited<ReturnType<typeof assertUser>> | null; ip: string }) => Promise<T>): (input: unknown) => Promise<ActionResult<T>>
checkRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; remaining: number; resetAt: Date }>
assertRateLimit(key: string, limit: number, windowSec: number)
getClientIp(): Promise<string>
safeReturnPath(value: unknown, fallback?: string): string
writeAudit(input: { actorId?: string | null; action: string; target: { type: string; id?: string | null }; meta?: Prisma.InputJsonValue; ip?: string | null })
sendEmail(input: { to: string; subject: string; react: ReactElement; text?: string; replyTo?: string }): Promise<{ ok: true; id?: string }>
buildMetadata(input?: { title?: string; description?: string; path?: string; image?: string; noIndex?: boolean }): Metadata
JsonLd({ data }: { data: Record<string, unknown> })
```

- `getServerEnv()` parses server env once; `isGoogleAuthEnabled(): boolean` checks the optional pair. `APP_URL` is the validated public origin.
- `getSession()` returns a cached active session or null. `requireUser(next?)`, `requireRole(roles: readonly Role[])`, and `requirePermission(permission: Permission)` guard pages. `assertUser()` and `assertPermission(permission: Permission)` throw safe errors for actions and route handlers. Banned users are denied.
- `can(user, permission: Permission): boolean` uses `ROLES` and `PERMISSIONS` and denies unknown or banned roles.
- `ActionResult<T>` is `{ ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }`. `ok<T>(data)`, `fail<T>(error, fieldErrors?)`, and `fromZodError(error)` build it.
- `safeAction<S extends z.ZodType, T>(options, handler)` returns `(input: unknown) => Promise<ActionResult<T>>`. It validates input, checks auth and permission, checks optional rate limit, supplies `{ user, ip }`, rethrows Next control flow, and maps other errors to safe results.
- `checkRateLimit(key: string, limit: number, windowSec: number)` returns `{ allowed, remaining, resetAt }`; `assertRateLimit(key, limit, windowSec)` throws on denial or storage failure. The app limiter uses `AppRateLimit`; Better Auth uses its own `RateLimit` table.
- `getClientIp(): Promise<string>` reads the first forwarded address and validates it. `writeAudit(input)` writes actor, action, target, metadata, and IP.
- `safeReturnPath(value, fallback?)` accepts only local redirect paths for login continuation.
- `sendEmail({ to, subject, react, text?, replyTo? }): Promise<{ ok: true; id?: string }>` renders HTML and text, then calls the selected provider. Provider functions take `{ to, from, subject, html, text, replyTo? }`.
- `buildMetadata({ title?, description?, path?, image?, noIndex? })` returns Next metadata. `organizationJsonLd()`, `websiteJsonLd()`, and `JsonLd({ data })` provide structured data.
- `AppModule` and `installedModules` form the only core to module registry. Import and array entry lines end with `// module:<id>`.

## Environment and use

Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM`. Optional: Google ID and secret pair, `EMAIL_PROVIDER`, `RESEND_API_KEY`, and SMTP host, port, user, password, secure flag. Console email is only for development. See `.env.example` and README for local setup.

Run `npm run db:dev`, copy its TCP URL to `.env`, then `npm run db:migrate`, `npm run db:seed`, and `npm run dev`. Module tools are `npm run module:list` and `npm run module:remove -- <id> --dry-run`.

## Verification and remaining work

Prisma schema validation and generation, TypeScript, ESLint, and Vitest passed. `next typegen` refreshed generated route types after moving the home page. Database migrations, seed execution, auth and email delivery, and browser smoke execution were intentionally not run because this task prohibited migrations and starting servers. Deployments must complete `docs/PRODUCTION_CHECKLIST.md` and verify those runtime flows with a real database and email provider.

The local sandbox could not launch `tsx` scripts because Node 24's `os.userInfo()` returned `uv_os_get_passwd ENOMEM`. Their source passed TypeScript and ESLint checks. Run `module:list` and a module removal dry run in a normal development shell before relying on the removal workflow.

Vitest passed with a nonfatal warning about a future native config loader and ESM syntax in `vitest.config.ts`. Revisit the config when upgrading Vitest or Vite.
