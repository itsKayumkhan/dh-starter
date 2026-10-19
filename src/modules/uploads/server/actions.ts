"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { safeAction } from "@/lib/safe-action";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";
import {
  createMedia,
  findMedia,
  findMediaByPublicId,
  removeMedia,
  toMediaDto,
} from "@/modules/uploads/server/media";
import { storage } from "@/modules/uploads/server/storage";
import {
  UPLOAD_RULES,
  uploadFolderSchema,
} from "@/modules/uploads/upload-rules";

const saveSchema = z.object({
  folder: uploadFolderSchema,
  publicId: z.string().min(1).max(300),
  ticket: z.string().regex(/^\d+\.[a-f0-9]{64}$/),
  alt: z.string().trim().max(250).optional(),
});

const save = safeAction(
  {
    schema: saveSchema,
    rateLimit: { key: "uploads:save", limit: 30, windowSec: 3600 },
  },
  async (input, { user, ip }) => {
    if (!user) throw new ForbiddenError();
    if (UPLOAD_RULES[input.folder].adminOnly && !can(user, "media:write"))
      throw new ForbiddenError();
    const asset = await storage.verify({
      folder: input.folder,
      ownerId: user.id,
      publicId: input.publicId,
      ticket: input.ticket,
    });
    const existing = await findMediaByPublicId(asset.publicId);
    if (existing) {
      if (existing.ownerId !== user.id) throw new ForbiddenError();
      return toMediaDto(existing);
    }
    const media = await createMedia({
      ownerId: user.id,
      ...asset,
      alt: input.alt || null,
    });
    await writeAudit({
      actorId: user.id,
      action: "media.create",
      target: { type: "Media", id: media.id },
      meta: { folder: input.folder, publicId: asset.publicId },
      ip,
    });
    revalidatePath(UPLOAD_ROUTES.media);
    return toMediaDto(media);
  },
);

export async function saveMedia(input: unknown) {
  return save(input);
}

const deleteSchema = z.object({ id: z.string().cuid() });
const remove = safeAction(
  {
    schema: deleteSchema,
    rateLimit: { key: "uploads:delete", limit: 30, windowSec: 3600 },
  },
  async ({ id }, { user, ip }) => {
    if (!user) throw new ForbiddenError();
    const media = await findMedia(id);
    if (!media) throw new NotFoundError();
    if (media.folder === "avatars") {
      if (media.ownerId !== user.id && !can(user, "media:write"))
        throw new ForbiddenError();
    } else if (!can(user, "media:write")) {
      throw new ForbiddenError();
    }
    await storage.destroy({
      publicId: media.publicId,
      resourceType: media.resourceType,
    });
    await removeMedia(media.id);
    await writeAudit({
      actorId: user.id,
      action: "media.delete",
      target: { type: "Media", id: media.id },
      meta: { folder: media.folder, publicId: media.publicId },
      ip,
    });
    revalidatePath(UPLOAD_ROUTES.media);
    return { id: media.id };
  },
);

export async function deleteMedia(input: unknown) {
  return remove(input);
}
