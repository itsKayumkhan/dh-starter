# Modules

Core (`src/lib`, `src/components`, and app paths outside module manifests) never imports a module. Project code in `src/features/` may import any installed module. Add a folder under `src/modules/<id>` with `module.ts`, `module.json`, and any server, component, schema, or env files it needs. Add its Prisma model in `prisma/schema/<id>.prisma` when needed. Put the import and array entry in `src/config/modules.ts`, each ending with `// module:<id>`.

The manifest fields are `id`, `name`, `description`, `paths`, `prismaFiles`, `packages`, `envKeys`, and `dependsOn`. Include every owned path so removal can cleanly delete it. List dependencies on other modules in `dependsOn`.

Run `npm run module:list` to inspect installed modules. Preview removal with `npm run module:remove -- <id> --dry-run`, then run without `--dry-run`. The preview lists imports of `@/modules/<id>` in `src/` outside the module's manifest paths and `src/config/modules.ts`, with file and line numbers. Removal stops before changes when these imports exist. Pass `--force` to proceed despite those references; the script still prints them. The script also blocks removal when another installed module depends on it, removes owned paths and registry lines, removes env keys from `.env.example`, and uninstalls packages only when no remaining source file imports them. Run `npx prisma migrate dev` afterward to drop removed tables.

To swap email transport, set `EMAIL_PROVIDER` to `resend` or `smtp` and supply the matching env keys. To remove Resend entirely, delete `src/lib/email/providers/resend.ts`, remove its import and map entry in `providers/index.ts`, then uninstall `resend`.
