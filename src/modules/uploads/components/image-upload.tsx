"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileUp, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { saveMedia } from "@/modules/uploads/server/actions";
import type { MediaDto } from "@/modules/uploads/server/media";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";
import {
  UPLOAD_RULES,
  type UploadFolder,
  validateUploadFile,
} from "@/modules/uploads/upload-rules";

const signedSchema = z.object({
  uploadUrl: z.string().startsWith("/api/uploads/"),
  publicId: z.string(),
  folder: z.string(),
  ticket: z.string(),
});
const cloudinaryResultSchema = z.object({ public_id: z.string() });

function uploadDirect(
  file: File,
  signed: z.infer<typeof signedSchema>,
  onProgress: (value: number) => void,
  onRequest: (request: XMLHttpRequest | null) => void,
) {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    onRequest(request);
    request.open("POST", signed.uploadUrl);
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("X-Upload-Folder", signed.folder);
    request.setRequestHeader("X-Upload-Public-Id", signed.publicId);
    request.setRequestHeader("X-Upload-Ticket", signed.ticket);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Upload connection failed."));
    request.onabort = () => reject(new Error("Upload canceled."));
    request.onload = () => {
      const result: unknown = (() => {
        try {
          return JSON.parse(request.responseText);
        } catch {
          return null;
        }
      })();
      const parsed = cloudinaryResultSchema.safeParse(result);
      if (request.status < 200 || request.status >= 300 || !parsed.success)
        reject(new Error("Upload was rejected."));
      else resolve(parsed.data.public_id);
    };
    request.send(file);
  });
}

export function ImageUpload({
  folder,
  value,
  onChange,
  maxSizeHint,
}: {
  folder: UploadFolder;
  value?: MediaDto | null;
  onChange: (media: MediaDto | null) => void;
  maxSizeHint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function start(file: File) {
    const validation = validateUploadFile({
      folder,
      bytes: file.size,
      mimeType: file.type,
    });
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setPending(true);
    setProgress(0);
    setPreview(URL.createObjectURL(file));
    try {
      const response = await fetch(UPLOAD_ROUTES.sign, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, bytes: file.size, mimeType: file.type }),
      });
      const raw: unknown = await response.json();
      const parsed = signedSchema.safeParse(raw);
      if (!response.ok || !parsed.success)
        throw new Error("Could not prepare the upload.");
      const publicId = await uploadDirect(
        file,
        parsed.data,
        setProgress,
        (request) => {
          requestRef.current = request;
        },
      );
      if (publicId !== parsed.data.publicId)
        throw new Error("Uploaded asset did not match the signed request.");
      const saved = await saveMedia({
        folder,
        publicId,
        ticket: parsed.data.ticket,
        alt: file.name,
      });
      if (!saved.ok) throw new Error(saved.error);
      onChange(saved.data);
      toast.success("Upload complete");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      requestRef.current = null;
      setPending(false);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const accept = UPLOAD_RULES[folder].mimeTypes.join(",");
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={inputId}>
        Upload {folder === "documents" ? "document" : "image"}
      </FieldLabel>
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={pending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void start(file);
        }}
      />
      <div
        className={`focus-within:ring-ring rounded-xl border border-dashed p-4 focus-within:ring-2 motion-safe:transition-colors ${dragging ? "bg-muted" : "bg-card"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file && !pending) void start(file);
        }}
      >
        {preview && folder !== "documents" ? (
          // This is a temporary browser object URL, not a remote source.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Selected file preview"
            className="mb-3 max-h-48 w-full rounded-lg object-contain"
          />
        ) : value ? (
          <p className="mb-3 text-sm break-all">
            Current: {value.alt || value.publicId}
          </p>
        ) : (
          <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
            <FileUp aria-hidden="true" className="size-5" />
            Drag a file here or choose one below.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {value ? (
              <RotateCcw aria-hidden="true" />
            ) : (
              <FileUp aria-hidden="true" />
            )}
            {pending ? "Uploading..." : value ? "Replace" : "Choose file"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onChange(null)}
            >
              <Trash2 aria-hidden="true" /> Remove selection
            </Button>
          )}
        </div>
        {pending && (
          <div className="mt-3" role="status" aria-live="polite">
            <span className="text-xs">Uploading: {progress}%</span>
            <Progress value={progress} aria-label="Upload progress" />
          </div>
        )}
      </div>
      <FieldDescription>
        {maxSizeHint ||
          `Maximum ${Math.round(UPLOAD_RULES[folder].maxBytes / 1024 / 1024)} MB.`}
      </FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
