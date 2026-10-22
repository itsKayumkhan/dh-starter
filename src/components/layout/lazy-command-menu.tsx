"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import type { NavItem } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";

const CommandMenuDialog = dynamic(
  () =>
    import("@/components/layout/command-menu-dialog").then(
      (module) => module.CommandMenuDialog,
    ),
  { ssr: false },
);

export function LazyCommandMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setLoaded(true);
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        aria-label="Open command menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="text-muted-foreground gap-2"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1 text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </Button>
      {loaded && (
        <CommandMenuDialog items={items} open={open} onOpenChange={setOpen} />
      )}
    </>
  );
}
