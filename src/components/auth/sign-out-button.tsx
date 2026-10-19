"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (!result.error) {
        router.replace(ROUTES.login);
        router.refresh();
        return;
      }
    } catch {
      toast.error("Could not sign out. Please try again.");
      setPending(false);
      return;
    }
    toast.error("Could not sign out. Please try again.");
    setPending(false);
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={signOut}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? "Signing out..." : (children ?? "Sign out")}
    </button>
  );
}
