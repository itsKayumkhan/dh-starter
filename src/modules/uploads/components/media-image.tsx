"use client";

import { FileText } from "lucide-react";
import { CldImage } from "next-cloudinary";
import type { MediaDto } from "@/modules/uploads/server/media";

export function MediaImage({
  media,
  width = 480,
  height = 320,
  className,
}: {
  media: Pick<MediaDto, "publicId" | "resourceType" | "alt">;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (media.resourceType !== "image")
    return (
      <div className="bg-muted text-muted-foreground flex h-full min-h-32 items-center justify-center">
        <FileText aria-hidden="true" className="size-8" />
        <span className="sr-only">Document preview unavailable</span>
      </div>
    );
  return (
    <CldImage
      src={media.publicId}
      alt={media.alt || "Uploaded image"}
      width={width}
      height={height}
      crop="fill"
      className={className}
    />
  );
}
