"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { contentRegistry, contentKeys } from "@/config/content";
import {
  settingsSchema,
  settingsDefaults,
  type SettingKey,
} from "@/config/settings";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { ConflictError, ValidationError } from "@/lib/errors";
import { safeAction } from "@/lib/safe-action";
import { blockRevision, settingsRevision } from "@/modules/cms/server/revision";

const limit = { key: "cms-edit", limit: 30, windowSec: 60 };
const blockKey = z.enum(
  contentKeys as [(typeof contentKeys)[number], ...typeof contentKeys],
);

export const saveSettings = safeAction(
  {
    schema: z.object({
      value: settingsSchema,
      revision: z.string().length(64),
    }),
    permission: "settings:write",
    rateLimit: limit,
  },
  async ({ value, revision }, { user, ip }) => {
    const result = await db.$transaction(
      async (tx) => {
        const before = await tx.siteSetting.findMany({
          select: { key: true, value: true, updatedAt: true },
        });
        if (settingsRevision(before) !== revision) throw new ConflictError();
        const old = new Map(before.map((row) => [row.key, row.value]));
        const keys = (Object.keys(value) as SettingKey[]).filter(
          (key) =>
            JSON.stringify(old.get(key) ?? settingsDefaults[key]) !==
            JSON.stringify(value[key]),
        );
        if (!keys.length) return { changedKeys: keys, revision };
        for (const key of keys) {
          if (
            JSON.stringify(value[key]) === JSON.stringify(settingsDefaults[key])
          )
            await tx.siteSetting.deleteMany({ where: { key } });
          else
            await tx.siteSetting.upsert({
              where: { key },
              create: {
                key,
                value: value[key] as Prisma.InputJsonValue,
                updatedBy: user?.id,
              },
              update: {
                value: value[key] as Prisma.InputJsonValue,
                updatedBy: user?.id,
              },
            });
        }
        await writeAudit(
          {
            actorId: user?.id,
            action: "cms.settings_saved",
            target: { type: "site-settings" },
            meta: {
              changedKeys: keys,
            } as Prisma.InputJsonValue,
            ip,
          },
          tx,
        );
        const after = await tx.siteSetting.findMany({
          select: { key: true, updatedAt: true, value: true },
        });
        return { changedKeys: keys, revision: settingsRevision(after) };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (result.changedKeys.length) updateTag("site-settings");
    return result;
  },
);

export const saveBlock = safeAction(
  {
    schema: z.object({
      key: blockKey,
      value: z.unknown(),
      revision: z.string().length(64).nullable(),
    }),
    permission: "content:write",
    rateLimit: limit,
  },
  async ({ key, value, revision }, { user, ip }) => {
    const parsed = contentRegistry[key].schema.safeParse(value);
    if (!parsed.success) throw new ValidationError();
    const result = await db.$transaction(
      async (tx) => {
        const before = await tx.contentBlock.findUnique({
          where: { key },
          select: { value: true, updatedAt: true },
        });
        if (blockRevision(before) !== revision) throw new ConflictError();
        const previous = before?.value ?? contentRegistry[key].defaultValue;
        const keys = Object.keys(parsed.data).filter(
          (field) =>
            JSON.stringify((previous as Record<string, unknown>)[field]) !==
            JSON.stringify((parsed.data as Record<string, unknown>)[field]),
        );
        if (!keys.length) return { changedKeys: keys, revision };
        const saved = await tx.contentBlock.upsert({
          where: { key },
          create: {
            key,
            value: parsed.data as Prisma.InputJsonValue,
            updatedBy: user?.id,
          },
          update: {
            value: parsed.data as Prisma.InputJsonValue,
            updatedBy: user?.id,
          },
        });
        await writeAudit(
          {
            actorId: user?.id,
            action: "cms.block_saved",
            target: { type: "content-block", id: key },
            meta: {
              changedKeys: keys,
            } as Prisma.InputJsonValue,
            ip,
          },
          tx,
        );
        return {
          changedKeys: keys,
          revision: blockRevision({
            updatedAt: saved.updatedAt,
            value: parsed.data,
          }),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (result.changedKeys.length) updateTag(`content:${key}`);
    return { key, ...result };
  },
);

export const resetBlock = safeAction(
  {
    schema: z.object({
      key: blockKey,
      revision: z.string().length(64).nullable(),
    }),
    permission: "content:write",
    rateLimit: limit,
  },
  async ({ key, revision }, { user, ip }) => {
    const didReset = await db.$transaction(
      async (tx) => {
        const before = await tx.contentBlock.findUnique({
          where: { key },
          select: { value: true, updatedAt: true },
        });
        if (blockRevision(before) !== revision) throw new ConflictError();
        if (!before) return false;
        const prior = contentRegistry[key].schema.safeParse(before.value);
        await tx.contentBlock.deleteMany({ where: { key } });
        await writeAudit(
          {
            actorId: user?.id,
            action: "cms.block_reset",
            target: { type: "content-block", id: key },
            meta: {
              changedKeys: prior.success ? Object.keys(prior.data) : [],
              beforeBytes: JSON.stringify(before.value)?.length ?? 0,
            } as Prisma.InputJsonValue,
            ip,
          },
          tx,
        );
        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (didReset) updateTag(`content:${key}`);
    return { key };
  },
);
