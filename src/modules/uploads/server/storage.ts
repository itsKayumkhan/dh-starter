import "server-only";
import type { UploadFolder } from "@/modules/uploads/upload-rules";
import { cloudinaryStorage } from "@/modules/uploads/server/cloudinary";

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  params: Record<string, string>;
  signature: string;
  publicId: string;
  folder: UploadFolder;
  ticket: string;
};

export type VerifiedAsset = {
  publicId: string;
  url: string;
  resourceType: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: UploadFolder;
};

export interface Storage {
  sign(input: { folder: UploadFolder; ownerId: string }): Promise<SignedUpload>;
  verify(input: {
    folder: UploadFolder;
    ownerId: string;
    publicId: string;
    ticket: string;
  }): Promise<VerifiedAsset>;
  destroy(input: { publicId: string; resourceType: string }): Promise<void>;
}

export const storage: Storage = cloudinaryStorage;
