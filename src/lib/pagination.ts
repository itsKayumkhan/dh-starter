import { z } from "zod";

const PAGE_SIZES = [10, 20, 50, 100] as const;
const positivePage = z.coerce.number().int().min(1).safe();
const pageSizeSchema = z.coerce.number().int().refine((value) =>
  PAGE_SIZES.some((size) => size === value),
);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseListParams(
  searchParams: Record<string, string | string[] | undefined>,
  opts: {
    sortable: readonly string[];
    filters?: readonly string[];
    defaultSort?: { field: string; dir: "asc" | "desc" };
  },
) {
  const page = positivePage.safeParse(first(searchParams.page));
  const pageSize = pageSizeSchema.safeParse(first(searchParams.pageSize));
  const q = (first(searchParams.q) ?? "").trim().slice(0, 100);
  const fallbackSort = opts.defaultSort ?? { field: "createdAt", dir: "desc" };
  const rawSort = first(searchParams.sort) ?? "";
  const separator = rawSort.lastIndexOf(":");
  const field = rawSort.slice(0, separator);
  const dir = rawSort.slice(separator + 1);
  const sort: { field: string; dir: "asc" | "desc" } = separator > 0 && opts.sortable.includes(field) && (dir === "asc" || dir === "desc")
    ? { field, dir }
    : fallbackSort;
  const filters = Object.fromEntries(
    (opts.filters ?? []).flatMap((key) => {
      const value = first(searchParams[key])?.trim();
      return value ? [[key, value]] : [];
    }),
  );
  const parsedPage = page.success ? page.data : 1;
  const parsedSize = pageSize.success ? pageSize.data : 20;

  return {
    page: parsedPage,
    pageSize: parsedSize,
    skip: (parsedPage - 1) * parsedSize,
    take: parsedSize,
    q,
    sort,
    filters,
  };
}

export function pageCount(total: number, pageSize: number): number {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(pageSize) || pageSize <= 0)
    return 0;
  return Math.ceil(total / pageSize);
}
