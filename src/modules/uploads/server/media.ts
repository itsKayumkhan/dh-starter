import "server-only";
import { db } from "@/lib/db";
import type { UploadFolder } from "@/modules/uploads/upload-rules";
import { Prisma } from "@/generated/prisma/client";
import { ConflictError, ValidationError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { storage } from "@/modules/uploads/server/storage";
import { UPLOAD_RULES } from "@/modules/uploads/upload-rules";

export type MediaDto = {
  id: string;
  publicId: string;
  url: string;
  resourceType: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: string;
  alt: string | null;
  createdAt: string;
};

export function toMediaDto(media: {
  id: string;
  publicId: string;
  url: string;
  resourceType: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: string;
  alt: string | null;
  createdAt: Date;
}): MediaDto {
  return { ...media, createdAt: media.createdAt.toISOString() };
}

export async function findMedia(id: string) {
  return db.media.findUnique({ where: { id } });
}

export async function findMediaByPublicId(publicId: string) {
  return db.media.findUnique({ where: { publicId } });
}

export async function createPendingUpload(input: {
  publicId: string;
  ownerId: string;
  folder: UploadFolder;
  expectedBytes: number;
  mimeType: string;
}) {
  return db.$transaction(
    async (tx) => {
      const [pendingCount, savedCount, pendingBytes, savedBytes] =
        await Promise.all([
          tx.pendingUpload.count({ where: { ownerId: input.ownerId } }),
          tx.media.count({
            where: { ownerId: input.ownerId },
          }),
          tx.pendingUpload.aggregate({
            where: { ownerId: input.ownerId },
            _sum: { expectedBytes: true },
          }),
          tx.media.aggregate({
            where: { ownerId: input.ownerId },
            _sum: { bytes: true },
          }),
        ]);
      if (
        pendingCount >= 20 ||
        savedCount >= 100 ||
        (pendingBytes._sum.expectedBytes ?? 0) +
          (savedBytes._sum.bytes ?? 0) +
          input.expectedBytes >
          100 * 1024 * 1024
      )
        throw new ValidationError();
      return tx.pendingUpload.create({
        data: {
          ...input,
          resourceType: UPLOAD_RULES[input.folder].resourceType,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function getPendingUpload(publicId: string, ownerId: string) {
  return db.pendingUpload.findFirst({
    where: { publicId, ownerId, expiresAt: { gt: new Date() } },
  });
}

export async function markPendingUploaded(publicId: string, ownerId: string) {
  const result = await db.pendingUpload.updateMany({
    where: {
      publicId,
      ownerId,
      expiresAt: { gt: new Date() },
      uploadingAt: { not: null },
      uploadedAt: null,
    },
    data: { uploadedAt: new Date() },
  });
  if (result.count !== 1) throw new ConflictError();
}

export async function claimPendingUpload(publicId: string, ownerId: string) {
  const result = await db.pendingUpload.updateMany({
    where: {
      publicId,
      ownerId,
      expiresAt: { gt: new Date() },
      uploadingAt: null,
      uploadedAt: null,
    },
    data: { uploadingAt: new Date() },
  });
  if (result.count !== 1) throw new ConflictError();
}

export async function saveVerifiedMedia(input: {
  ownerId: string;
  publicId: string;
  url: string;
  resourceType: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: UploadFolder;
  alt: string | null;
  ip: string;
}) {
  return db.$transaction(
    async (tx) => {
      const pending = await tx.pendingUpload.findUnique({
        where: { publicId: input.publicId },
      });
      if (
        !pending ||
        pending.ownerId !== input.ownerId ||
        pending.folder !== input.folder ||
        !pending.uploadedAt ||
        pending.expiresAt <= new Date()
      )
        throw new ValidationError();
      const media = await tx.media.create({
        data: {
          ownerId: input.ownerId,
          publicId: input.publicId,
          url: input.url,
          resourceType: input.resourceType,
          format: input.format,
          bytes: input.bytes,
          width: input.width,
          height: input.height,
          folder: input.folder,
          alt: input.alt,
        },
      });
      await writeAudit(
        {
          actorId: input.ownerId,
          action: "media.create",
          target: { type: "Media", id: media.id },
          meta: { folder: input.folder, publicId: input.publicId },
          ip: input.ip,
        },
        tx,
      );
      await tx.pendingUpload.delete({ where: { publicId: input.publicId } });
      return media;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function requestMediaDeletion(
  media: { id: string; folder: string; publicId: string },
  actorId: string,
  ip: string,
) {
  await db.$transaction(async (tx) => {
    const result = await tx.media.updateMany({
      where: { id: media.id, deletePendingAt: null },
      data: {
        deletePendingAt: new Date(),
        deleteRequestedBy: actorId,
        deleteRequestIp: ip,
      },
    });
    if (result.count !== 1) throw new ConflictError();
    await writeAudit(
      {
        actorId,
        action: "media.delete_requested",
        target: { type: "Media", id: media.id },
        meta: { folder: media.folder, publicId: media.publicId },
        ip,
      },
      tx,
    );
  });
}

export async function finishMediaDeletion(
  media: {
    id: string;
    folder: string;
    publicId: string;
    resourceType: string;
    deleteRequestedBy?: string | null;
    deleteRequestIp?: string | null;
  },
  actorId?: string,
  ip?: string,
) {
  await storage.destroy({
    publicId: media.publicId,
    resourceType: media.resourceType,
  });
  await db.$transaction(async (tx) => {
    const result = await tx.media.deleteMany({
      where: { id: media.id, deletePendingAt: { not: null } },
    });
    if (result.count === 0) return;
    await writeAudit(
      {
        actorId: actorId ?? media.deleteRequestedBy,
        action: "media.delete",
        target: { type: "Media", id: media.id },
        meta: { folder: media.folder, publicId: media.publicId },
        ip: ip ?? media.deleteRequestIp,
      },
      tx,
    );
  });
}

export async function cleanupExpiredUploads(limit = 50) {
  const expired = await db.pendingUpload.findMany({
    where: { expiresAt: { lt: new Date() } },
    orderBy: { expiresAt: "asc" },
    take: limit,
  });
  let cleaned = 0;
  let failed = 0;
  for (const pending of expired) {
    try {
      // A public ID can be sent to a different Cloudinary resource endpoint.
      for (const resourceType of ["image", "raw", "video"]) {
        await storage.destroy({ publicId: pending.publicId, resourceType });
      }
      await db.pendingUpload.deleteMany({
        where: { publicId: pending.publicId, expiresAt: { lt: new Date() } },
      });
      cleaned++;
    } catch (error) {
      logger.error("Pending upload cleanup failed", { error });
      failed++;
    }
  }
  const deletions = await db.media.findMany({
    where: { deletePendingAt: { not: null } },
    take: limit,
  });
  for (const media of deletions) {
    try {
      await finishMediaDeletion(media);
      cleaned++;
    } catch (error) {
      logger.error("Media deletion retry failed", { error });
      failed++;
    }
  }
  return { cleaned, failed };
}

export async function listMedia(input: {
  skip: number;
  take: number;
  q: string;
  folder?: UploadFolder;
  sort: { field: "createdAt"; dir: "asc" | "desc" };
}) {
  const where = {
    deletePendingAt: null,
    ...(input.folder ? { folder: input.folder } : {}),
    ...(input.q
      ? {
          OR: [
            { publicId: { contains: input.q, mode: "insensitive" as const } },
            { alt: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: input.sort.dir },
      skip: input.skip,
      take: input.take,
    }),
    db.media.count({ where }),
  ]);
  return { items: items.map(toMediaDto), total };
}
