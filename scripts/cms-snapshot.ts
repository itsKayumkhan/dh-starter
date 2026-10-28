import pg from "pg";
import { requireLocalE2ESetup } from "../src/lib/env/test";

export type ContentBlockSnapshot = {
  value: unknown;
  updatedAt: Date;
  updatedBy: string | null;
} | null;

type QueryClient = {
  connect(): Promise<unknown>;
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

export async function withContentBlockSnapshot<T>(
  key: string,
  action: (original: ContentBlockSnapshot) => Promise<T>,
  createClient: (url: string) => QueryClient = (url) =>
    new pg.Client({ connectionString: url }),
): Promise<T> {
  const client = createClient(requireLocalE2ESetup());
  await client.connect();
  try {
    const result = await client.query(
      'select "value", "updatedAt", "updatedBy" from "ContentBlock" where "key" = $1',
      [key],
    );
    const original =
      (result.rows[0] as ContentBlockSnapshot | undefined) ?? null;
    try {
      return await action(original);
    } finally {
      if (original) {
        await client.query(
          'insert into "ContentBlock" ("key", "value", "updatedAt", "updatedBy") values ($1, $2::jsonb, $3, $4) on conflict ("key") do update set "value" = excluded."value", "updatedAt" = excluded."updatedAt", "updatedBy" = excluded."updatedBy"',
          [
            key,
            JSON.stringify(original.value),
            original.updatedAt,
            original.updatedBy,
          ],
        );
      } else {
        await client.query('delete from "ContentBlock" where "key" = $1', [
          key,
        ]);
      }
    }
  } finally {
    await client.end();
  }
}
