# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin can review users and audit history
- Location: tests\e2e\admin.spec.ts:6:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Profile' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Profile' }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Profile' })

```

```yaml
- list:
  - listitem:
    - link "DH DH Starter":
      - /url: /dashboard
- text: Dashboard
- list:
  - listitem:
    - link "Overview":
      - /url: /dashboard
  - listitem:
    - link "Account":
      - /url: /dashboard/account
  - listitem:
    - link "Billing":
      - /url: /dashboard/billing
  - listitem:
    - link "Notifications":
      - /url: /dashboard/notifications
- text: Admin
- list:
  - listitem:
    - link "Overview":
      - /url: /admin
  - listitem:
    - link "Users":
      - /url: /admin/users
  - listitem:
    - link "Audit log":
      - /url: /admin/audit
  - listitem:
    - link "Media library":
      - /url: /admin/media
  - listitem:
    - link "Payments":
      - /url: /admin/billing
  - listitem:
    - link "Send notification":
      - /url: /admin/notifications
  - listitem:
    - link "Inquiries":
      - /url: /admin/inquiries
- text: admin@dhstarter.test
- button "Toggle Sidebar"
- main:
  - button "Toggle sidebar": Toggle Sidebar
  - navigation "breadcrumb":
    - list:
      - listitem:
        - link "Admin":
          - /url: /admin
      - listitem:
        - link "Users" [disabled]
  - button "Open command menu": Search Ctrl K
  - heading "Navigate" [level=2]
  - paragraph: Search pages you can access
  - button "Notifications"
  - button "Choose theme"
  - button "Open user menu": A
  - main:
    - heading "Users" [level=1]
    - paragraph: Manage access and review account activity.
    - button "Invite user"
    - textbox "Search table":
      - /placeholder: Search names and emails
    - combobox "Role": All role
    - combobox "Status": All status
    - table:
      - rowgroup:
        - row "Sort by name Sort by role Status Sort by createdAt Last active Actions":
          - columnheader "Sort by name":
            - button "Sort by name": User
          - columnheader "Sort by role":
            - button "Sort by role": Role
          - columnheader "Status"
          - columnheader "Sort by createdAt":
            - button "Sort by createdAt": Created
          - columnheader "Last active"
          - columnheader "Actions"
      - rowgroup:
        - row "US User user@dhstarter.test user active 10/19/2026 10/19/2026 Actions for User":
          - cell "US User user@dhstarter.test":
            - link "US User user@dhstarter.test":
              - /url: /admin/users/UlwLqsaDe5ROH1xfsYJEwp8kxffvU4R3
          - cell "user"
          - cell "active"
          - cell "10/19/2026":
            - time: 10/19/2026
          - cell "10/19/2026":
            - time: 10/19/2026
          - cell "Actions for User":
            - button "Actions for User"
        - row "ST Staff staff@dhstarter.test staff active 10/19/2026 10/19/2026 Actions for Staff":
          - cell "ST Staff staff@dhstarter.test":
            - link "ST Staff staff@dhstarter.test":
              - /url: /admin/users/k87jMM52UuGKm6L6zH618NIL2lqbHsZa
          - cell "staff"
          - cell "active"
          - cell "10/19/2026":
            - time: 10/19/2026
          - cell "10/19/2026":
            - time: 10/19/2026
          - cell "Actions for Staff":
            - button "Actions for Staff"
        - row "AD Admin admin@dhstarter.test admin active 10/19/2026 10/19/2026 Actions for Admin":
          - cell "AD Admin admin@dhstarter.test":
            - link "AD Admin admin@dhstarter.test":
              - /url: /admin/users/yeHzSpFJnyY6D38S8ctfVSrzU4Hkxmmk
          - cell "admin"
          - cell "active"
          - cell "10/19/2026":
            - time: 10/19/2026
          - cell "10/19/2026":
            - time: 10/19/2026
          - cell "Actions for Admin":
            - button "Actions for Admin"
    - text: Rows per page
    - combobox "Rows per page": "20"
    - text: Page 1 of 1
    - button "Previous page" [disabled]
    - button "Next page" [disabled]
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { hasLocalAdminE2ESetup } from "@/modules/admin/env";
  3  | import { ADMIN_ROUTES } from "@/modules/admin/routes";
  4  | import { ROUTES } from "@/lib/constants/routes";
  5  | 
  6  | test("admin can review users and audit history", async ({ page }) => {
  7  |   test.skip(!hasLocalAdminE2ESetup(), "Requires a local database seeded with the development admin account.");
  8  |   await page.goto(ROUTES.login);
  9  |   await page.getByLabel("Email").fill("admin@dhstarter.test");
  10 |   await page.getByLabel("Password").fill("DhStarter@Admin2026");
  11 |   await page.getByRole("button", { name: /sign in/i }).click();
  12 |   await page.waitForURL((url) => url.pathname.startsWith(ROUTES.dashboard));
  13 |   await page.goto(ADMIN_ROUTES.users);
  14 |   await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  15 |   await expect(page.getByRole("button", { name: "Invite user" })).toBeVisible();
  16 |   await page.getByRole("link", { name: /admin@dhstarter.test/i }).first().click();
> 17 |   await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  18 |   await expect(page.getByRole("heading", { name: /Sessions/ })).toBeVisible();
  19 |   await page.goto(ADMIN_ROUTES.audit);
  20 |   await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  21 | });
  22 | 
```