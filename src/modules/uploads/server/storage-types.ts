// test-exempt: types only
import type { UploadFolder } from "@/modules/uploads/upload-rules";

export type SignedUpload = {
  uploadUrl: string;
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
  upload(input: {
    folder: UploadFolder;
    ownerId: string;
    publicId: string;
    ticket: string;
    bytes: Buffer;
  }): Promise<VerifiedAsset>;
  verify(input: {
    folder: UploadFolder;
    ownerId: string;
    publicId: string;
    ticket: string;
  }): Promise<VerifiedAsset>;
  destroy(input: { publicId: string; resourceType: string }): Promise<void>;
}
