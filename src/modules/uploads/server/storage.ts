// test-exempt: binds the Storage type to the Cloudinary adapter, which has its own tests
import "server-only";
import { cloudinaryStorage } from "@/modules/uploads/server/cloudinary";
import type { Storage } from "@/modules/uploads/server/storage-types";
export type {
  SignedUpload,
  VerifiedAsset,
  Storage,
} from "@/modules/uploads/server/storage-types";

export const storage: Storage = cloudinaryStorage;
