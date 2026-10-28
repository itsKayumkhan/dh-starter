import "server-only";
import { db } from "@/lib/db";
import { mergeSettings } from "@/lib/content/settings";
import { contentRegistry, type ContentKey } from "@/config/content";
import { settingSchemas, type SettingKey } from "@/config/settings";
import { blockRevision, settingsRevision } from "@/modules/cms/server/revision";

export async function getSettingsEditorData() {
  const rows = await db.siteSetting.findMany({
    select: { key: true, value: true, updatedAt: true, updatedBy: true },
  });
  const value = mergeSettings(rows);
  const editable = rows.every(
    (row) =>
      !(row.key in settingSchemas) ||
      settingSchemas[row.key as SettingKey].safeParse(row.value).success,
  );
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
    editable,
    revision: settingsRevision(rows),
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
    editable: !row || contentRegistry[key].schema.safeParse(row.value).success,
    revision: blockRevision(row),
    editorName: editor?.name ?? row?.updatedBy ?? null,
  };
}
