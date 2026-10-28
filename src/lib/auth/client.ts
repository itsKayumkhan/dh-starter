"use client";
import { createAuthClient } from "better-auth/react";
import { APP_URL } from "@/lib/env/client";

export const authClient = createAuthClient({
  baseURL: APP_URL,
});
