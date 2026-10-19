"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Images, Search } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MediaImage } from "@/modules/uploads/components/media-image";
import type { MediaDto } from "@/modules/uploads/server/media";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";

const mediaSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  url: z.url(),
  resourceType: z.string(),
  format: z.string(),
  bytes: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  folder: z.string(),
  alt: z.string().nullable(),
  createdAt: z.string(),
});
const listSchema = z.object({
  items: z.array(mediaSchema),
  pageCount: z.number().int(),
});

export function MediaPicker({
  value,
  onChange,
  trigger,
}: {
  value?: MediaDto | null;
  onChange: (media: MediaDto) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaDto[]>([]);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
          folder: "media",
        });
        if (query) params.set("q", query);
        const response = await fetch(`${UPLOAD_ROUTES.list}?${params}`, {
          signal: controller.signal,
        });
        const raw: unknown = await response.json();
        const parsed = listSchema.safeParse(raw);
        if (!response.ok || !parsed.success)
          throw new Error("Could not load the media library.");
        setItems(parsed.data.items);
        setPages(parsed.data.pageCount);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(
          caught instanceof Error ? caught.message : "Could not load media.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [open, page, query, retry]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline">
            <Images aria-hidden="true" />{" "}
            {value ? "Change image" : "Choose image"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            Select a managed image from the media library.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            aria-label="Search images"
            placeholder="Search images"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setPage(1);
                setQuery(q.trim());
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <Search aria-hidden="true" /> Search
          </Button>
        </div>
        {loading ? (
          <p role="status" className="text-muted-foreground text-sm">
            Loading images...
          </p>
        ) : error ? (
          <div role="alert" className="text-destructive space-y-2 text-sm">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRetry(retry + 1)}
            >
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No images found.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((media) => (
              <button
                key={media.id}
                type="button"
                className="focus-visible:ring-ring overflow-hidden rounded-lg border text-left outline-none focus-visible:ring-2"
                onClick={() => {
                  onChange(media);
                  setOpen(false);
                }}
                aria-label={`Choose ${media.alt || media.publicId}`}
              >
                <div className="bg-muted aspect-[4/3] overflow-hidden">
                  <MediaImage
                    media={media}
                    width={300}
                    height={225}
                    className="size-full object-cover"
                  />
                </div>
                <span className="block truncate p-2 text-xs">
                  {media.alt || media.publicId}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Page {Math.min(page, Math.max(pages, 1))} of {Math.max(pages, 1)}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading || page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
