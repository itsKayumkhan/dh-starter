# Fix boundaries needs

`src/lib/email/templates/email-render.test.tsx` is outside my assigned paths and imports `@/modules/contact/*` on lines 10-12. The new boundary check reports all three imports. Please move those contact-specific tests into `src/modules/contact/` (which the contact manifest owns) or remove the module imports from the core test. The test also has to be removed by `module:remove contact` for the all-modules-removed typecheck to pass.
