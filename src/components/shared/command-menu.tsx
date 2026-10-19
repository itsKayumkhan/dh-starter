"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { NavItem } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";

export function CommandMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Open command menu" className="gap-2 text-muted-foreground">
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1 text-[10px] sm:inline">Ctrl K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Navigate" description="Search pages you can access">
        <CommandInput placeholder="Search pages..." aria-label="Search pages" />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          {(["dashboard", "admin"] as const).map((section) => {
            const entries = items.filter((item) => item.section === section);
            return entries.length ? (
              <CommandGroup key={section} heading={section === "dashboard" ? "Dashboard" : "Admin"}>
                {entries.map((item) => <CommandItem key={`${section}:${item.href}`} value={`${section} ${item.title}`} onSelect={() => { setOpen(false); router.push(item.href); }}>
                  <item.icon aria-hidden="true" />
                  <span>{item.title}</span>
                  <CommandShortcut>Go</CommandShortcut>
                </CommandItem>)}
              </CommandGroup>
            ) : null;
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
