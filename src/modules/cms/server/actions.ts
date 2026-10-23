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
import { ValidationError } from "@/lib/errors";
import { safeAction } from "@/lib/safe-action";

const limit = { key: "cms-edit", limit: 30, windowSec: 60 };
const blockKey = z.enum(
  contentKeys as [(typeof contentKeys)[number], ...typeof contentKeys],
);

export const saveSettings = safeAction(
  { schema: settingsSchema, permission: "settings:write", rateLimit: limit },
  async (value, { user, ip }) => {
    const changedKeys = await db.$transaction(async (tx) => {
      const before = await tx.siteSetting.findMany({
        select: { key: true, value: true },
      });
      const old = new Map(before.map((row) => [row.key, row.value]));
      const keys = (Object.keys(value) as SettingKey[]).filter(
        (key) =>
          JSON.stringify(old.get(key) ?? settingsDefaults[key]) !==
          JSON.stringify(value[key]),
      );
      if (!keys.length) return keys;
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
      const beforeValues = Object.fromEntries(
        keys.map((key) => [key, old.get(key) ?? settingsDefaults[key]]),
      );
      const afterValues = Object.fromEntries(
        keys.map((key) => [key, value[key]]),
      );
      await writeAudit(
        {
          actorId: user?.id,
          action: "cms.settings_saved",
          target: { type: "site-settings" },
          meta: {
            changedKeys: keys,
            before: beforeValues,
            after: afterValues,
          } as Prisma.InputJsonValue,
          ip,
        },
        tx,
      );
      return keys;
    });
    if (changedKeys.length) updateTag("site-settings");
    return { changedKeys };
  },
);

export const saveBlock = safeAction(
  {
    schema: z.object({ key: blockKey, value: z.unknown() }),
    permission: "content:write",
    rateLimit: limit,
  },
  async ({ key, value }, { user, ip }) => {
    const parsed = contentRegistry[key].schema.safeParse(value);
    if (!parsed.success) throw new ValidationError();
    const changedKeys = await db.$transaction(async (tx) => {
      const before = await tx.contentBlock.findUnique({
        where: { key },
        select: { value: true },
      });
      const previous = before?.value ?? contentRegistry[key].defaultValue;
      const keys = Object.keys(parsed.data).filter(
        (field) =>
          JSON.stringify((previous as Record<string, unknown>)[field]) !==
          JSON.stringify((parsed.data as Record<string, unknown>)[field]),
      );
      if (!keys.length) return keys;
      await tx.contentBlock.upsert({
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
      const beforeValues = Object.fromEntries(
        keys.map((field) => [
          field,
          (previous as Record<string, unknown>)[field],
        ]),
      );
      const afterValues = Object.fromEntries(
        keys.map((field) => [
          field,
          (parsed.data as Record<string, unknown>)[field],
        ]),
      );
      await writeAudit(
        {
          actorId: user?.id,
          action: "cms.block_saved",
          target: { type: "content-block", id: key },
          meta: {
            changedKeys: keys,
            before: beforeValues,
            after: afterValues,
          } as Prisma.InputJsonValue,
          ip,
        },
        tx,
      );
      return keys;
    });
    if (changedKeys.length) updateTag(`content:${key}`);
    return { key, changedKeys };
  },
);

export const resetBlock = safeAction(
  {
    schema: z.object({ key: blockKey }),
    permission: "content:write",
    rateLimit: limit,
  },
  async ({ key }, { user, ip }) => {
    const didReset = await db.$transaction(async (tx) => {
      const before = await tx.contentBlock.findUnique({
        where: { key },
        select: { value: true },
      });
      if (!before) return false;
      await tx.contentBlock.deleteMany({ where: { key } });
      await writeAudit(
        {
          actorId: user?.id,
          action: "cms.block_reset",
          target: { type: "content-block", id: key },
          meta: {
            changedKeys: Object.keys(before.value as object),
            before: before.value,
            after: contentRegistry[key].defaultValue,
          } as Prisma.InputJsonValue,
          ip,
        },
        tx,
      );
      return true;
    });
    if (didReset) updateTag(`content:${key}`);
    return { key };
  },
);
