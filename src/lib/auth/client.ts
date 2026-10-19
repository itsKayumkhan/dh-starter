"use client";
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { APP_URL } from "@/lib/env/client";

export const authClient = createAuthClient({
  baseURL: APP_URL,
  plugins: [adminClient()],
});
