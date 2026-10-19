"use client";

import { formatBytes } from "@/lib/format";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, Images, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
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
import { ImageUpload } from "@/modules/uploads/components/image-upload";
import { MediaImage } from "@/modules/uploads/components/media-image";
import { deleteMedia } from "@/modules/uploads/server/actions";
import type { MediaDto } from "@/modules/uploads/server/media";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";
import type { UploadFolder } from "@/modules/uploads/upload-rules";

export function MediaLibrary({
  items,
  total,
  page,
  pages,
  pageSize,
  query,
  folder,
}: {
  items: MediaDto[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  query: string;
  folder?: UploadFolder;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<UploadFolder>("media");

  function navigate(next: { page?: number; q?: string; folder?: string }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? query;
    const nextFolder = next.folder ?? folder;
    if (nextQ) params.set("q", nextQ);
    if (nextFolder) params.set("folder", nextFolder);
    if (pageSize !== 20) params.set("pageSize", String(pageSize));
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const suffix = params.toString();
    router.push(
      suffix ? `${UPLOAD_ROUTES.media}?${suffix}` : UPLOAD_ROUTES.media,
    );
  }

  async function remove(id: string) {
    const result = await deleteMedia({ id });
    if (!result.ok) throw new Error(result.error);
    toast.success("Media deleted");
    router.refresh();
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied");
    } catch {
      toast.error("Could not copy URL");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Media library"
        description={`${total} managed assets`}
        actions={
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload aria-hidden="true" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload media</DialogTitle>
                <DialogDescription>
                  Choose a folder, then add an image or PDF.
                </DialogDescription>
              </DialogHeader>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Upload folder"
              >
                {(["media", "documents"] as const).map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant={uploadFolder === item ? "default" : "outline"}
                    onClick={() => setUploadFolder(item)}
                  >
                    {item === "media" ? "Images" : "Documents"}
                  </Button>
                ))}
              </div>
              <ImageUpload
                key={uploadFolder}
                folder={uploadFolder}
                onChange={(media) => {
                  if (media) {
                    setUploadOpen(false);
                    router.refresh();
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-2">
          <Input
            aria-label="Search media"
            placeholder="Search file name or alt text"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate({ q: q.trim() });
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ q: q.trim() })}
          >
            <Search aria-hidden="true" /> Search
          </Button>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by folder"
        >
          {(["all", "media", "documents", "avatars"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={(folder ?? "all") === item ? "default" : "outline"}
              onClick={() =>
                navigate({ folder: item === "all" ? "" : item, page: 1 })
              }
            >
              {item === "all" ? "All" : item}
            </Button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No media found"
          description="Upload a file or change the search filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((media) => (
            <article
              key={media.id}
              className="bg-card min-w-0 overflow-hidden rounded-xl border"
            >
              <div className="bg-muted aspect-[4/3] overflow-hidden">
                <MediaImage
                  media={media}
                  width={480}
                  height={360}
                  className="size-full object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <p
                  className="truncate text-sm font-medium"
                  title={media.alt || media.publicId}
                >
                  {media.alt || media.publicId}
                </p>
                <p className="text-muted-foreground text-xs">
                  {media.folder} · {formatBytes(media.bytes)} ·{" "}
                  {media.format.toUpperCase()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copy(media.url)}
                  >
                    <Clipboard aria-hidden="true" /> Copy URL
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button type="button" size="sm" variant="destructive">
                        <Trash2 aria-hidden="true" /> Delete
                      </Button>
                    }
                    title="Delete media?"
                    description="This removes the Cloudinary asset and its library record. Links to it will stop working."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => remove(media.id)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <nav
        className="flex items-center justify-between gap-3 text-sm"
        aria-label="Media pages"
      >
        <span className="text-muted-foreground">
          Page {Math.min(page, Math.max(pages, 1))} of {Math.max(pages, 1)}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => navigate({ page: page - 1 })}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={page >= pages}
            onClick={() => navigate({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      </nav>
    </main>
  );
}
