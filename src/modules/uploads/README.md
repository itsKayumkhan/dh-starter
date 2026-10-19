# Cloudinary uploads

This module signs browser uploads for three folders: `avatars` (images, 2 MB), `media` (images, 10 MB), and `documents` (PDF, 10 MB). Media and documents require `media:write`; avatars require a signed-in user. The server verifies every uploaded asset with Cloudinary's Admin API before creating a `Media` row.

## Setup

Set these keys in the deployment environment. They are parsed only when uploads are used:

| Key                                 | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                                    |
| `CLOUDINARY_API_KEY`                | Signed upload API key                                    |
| `CLOUDINARY_API_SECRET`             | Signature and upload ticket secret                       |
| `CLOUDINARY_FOLDER_PREFIX`          | App-owned Cloudinary folder prefix, such as `dh-starter` |

Generate the Prisma client and apply the uploads schema through the project's normal migration process. Register `uploadsModule` in `src/config/modules.ts` with `// module:uploads` markers so the admin navigation appears and module removal works.

## Use

Use `ImageUpload` with a folder, a `MediaDto | null` value, and an `onChange` callback. Replacing or removing the selection changes the field only; it does not delete previously saved assets. Use the media library delete control or `deleteMedia` for permanent removal. `MediaPicker` selects existing images. `MediaImage` renders managed images with `CldImage` and a document fallback.

The browser requests `POST /api/uploads/sign`, uploads directly to Cloudinary with the signed parameters, then calls `saveMedia`. The server checks the signed upload ticket, folder prefix, resource type, format, byte size, and Cloudinary asset metadata. There is no unsigned upload preset.

The admin library is at `/admin/media`. It supports search, folder filters, and server pagination. `GET /api/uploads/media` supplies picker pages to staff and admins.

To swap providers, implement the `Storage` interface and change the exported implementation in `server/storage.ts`.

## Removal

The manifest owns the module, uploads API routes, admin page, and Prisma model. Run the module removal script after dependent project features are removed, then apply a database migration that drops `Media`.
