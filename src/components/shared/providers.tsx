"use client";
import { useEffect, type ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { site } from "@/config/site";
import { Toaster } from "@/components/ui/sonner";

function AllowedThemeGuard() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    const allowedModes: readonly string[] = site.theme.allowedModes;
    if (theme && !allowedModes.includes(theme))
      setTheme(site.theme.defaultMode);
  }, [theme, setTheme]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const allowedModes: readonly string[] = site.theme.allowedModes;
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={site.theme.defaultMode}
      themes={allowedModes.filter((mode) => mode !== "system")}
      enableSystem={allowedModes.includes("system")}
      forcedTheme={allowedModes.length === 1 ? allowedModes[0] : undefined}
    >
      <AllowedThemeGuard />
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
