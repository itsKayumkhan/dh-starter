# CMS module

Adds Site settings and Content under the admin navigation. Admins can change settings and content. Staff can change content. Regular users cannot open either editor.

The module owns the editor routes and actions. The tables, registry and public read helpers are core so removing this module leaves the public site working with saved values and defaults. There are no module environment keys or packages.

Set the project brand and default copy in `src/config/site.ts` and `src/config/content.ts` before launch. Content values saved in the database override those defaults. The logo and avatar fields accept public image URLs.

Run `npm run module:remove -- cms --dry-run` to preview removal. Run without `--dry-run` to remove the editor. The core content schema and public pages remain.
