import "server-only";
import { db } from "@/lib/db";
import type { UploadFolder } from "@/modules/uploads/upload-rules";

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

export async function createMedia(input: {
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
}) {
  return db.media.create({ data: input });
}

export async function removeMedia(id: string) {
  return db.media.delete({ where: { id } });
}

export async function listMedia(input: {
  skip: number;
  take: number;
  q: string;
  folder?: UploadFolder;
  sort: { field: "createdAt"; dir: "asc" | "desc" };
}) {
  const where = {
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
