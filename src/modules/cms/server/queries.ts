import "server-only";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/content/settings";
import { contentRegistry, type ContentKey } from "@/config/content";

export async function getSettingsEditorData() {
  const [value, rows] = await Promise.all([
    getSiteSettings(),
    db.siteSetting.findMany({
      select: { key: true, updatedAt: true, updatedBy: true },
    }),
  ]);
  const ids = [
    ...new Set(
      rows
        .map((row) => row.updatedBy)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const editors = ids.length
    ? await db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    : [];
  return {
    value,
    rows,
    editors: Object.fromEntries(editors.map((user) => [user.id, user.name])),
  };
}

export async function getBlockEditorData(key: ContentKey) {
  const row = await db.contentBlock.findUnique({
    where: { key },
    select: { value: true, updatedAt: true, updatedBy: true },
  });
  const editor = row?.updatedBy
    ? await db.user.findUnique({
        where: { id: row.updatedBy },
        select: { name: true },
      })
    : null;
  return {
    block: contentRegistry[key],
    row,
    editorName: editor?.name ?? row?.updatedBy ?? null,
  };
}
