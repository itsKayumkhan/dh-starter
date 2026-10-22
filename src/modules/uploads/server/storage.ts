import "server-only";
import { cloudinaryStorage } from "@/modules/uploads/server/cloudinary";
import type { Storage } from "@/modules/uploads/server/storage-types";
export type {
  SignedUpload,
  VerifiedAsset,
  Storage,
} from "@/modules/uploads/server/storage-types";

export const storage: Storage = cloudinaryStorage;
