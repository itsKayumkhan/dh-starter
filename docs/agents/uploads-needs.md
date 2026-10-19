# Uploads integration needs

- Register `uploadsModule` in `src/config/modules.ts` with import and array entry lines ending in `// module:uploads`. The uploads agent cannot edit this shared file during the parallel wave.
- Apply a migration for `prisma/schema/uploads.prisma` after agents finish. The uploads agent did not run migrations.
