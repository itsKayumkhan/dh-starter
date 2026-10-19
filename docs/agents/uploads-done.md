# Uploads module delivery

## Files

- `src/modules/uploads/`: manifest, nav entry, lazy env validation, upload rules and unit tests, Cloudinary storage adapter, media data access, server actions, and upload, picker, image, and library components.
- `prisma/schema/uploads.prisma`: `Media` model with owner and folder indexes.
- `src/app/api/uploads/sign/route.ts`: authenticated, rate limited signing endpoint.
- `src/app/api/uploads/media/route.ts`: permission guarded, paginated library endpoint.
- `src/app/(dashboard)/admin/media/page.tsx`: permission guarded media page.
- `tests/e2e/uploads.spec.ts`: anonymous signing rejection and a skipped authenticated Cloudinary flow.
- `docs/agents/uploads-needs.md` and `docs/agents/uploads-checklist.md`: integration and production handoff.

## Use and environment

Import `ImageUpload`, `MediaPicker`, or `MediaImage` from this module. The admin route is `/admin/media`; `saveMedia` and `deleteMedia` are the server actions. See `src/modules/uploads/README.md` for setup and removal.

Required env keys: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER_PREFIX`. `module.json` lists the module paths, Prisma file, `next-cloudinary` and `cloudinary` packages, and these four keys; it has no module dependencies.

## Verification and TODO

- Prisma validation and client generation passed.
- Upload rule unit tests passed (3 tests). ESLint passed on owned source and e2e spec.
- TypeScript reported no errors in owned files. The full repo check still fails in other agents' files, primarily the shared TanStack table and modules using it.
- Register the module in the shared `src/config/modules.ts`, apply the Prisma migration, and add production Cloudinary credentials. These are assigned to the lead in `uploads-needs.md`.
- Run the authenticated Playwright upload flow after a seeded staff session, migrated database, and Cloudinary account are available. The uploads agent did not start Next or run migrations.
