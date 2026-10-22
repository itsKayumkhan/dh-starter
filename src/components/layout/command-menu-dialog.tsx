"use client";

import { useRouter } from "next/navigation";
import type { NavItem } from "@/components/layout/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenuDialog({
  items,
  open,
  onOpenChange,
}: {
  items: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Navigate"
      description="Search pages you can access"
    >
      <Command>
        <CommandInput placeholder="Search pages..." aria-label="Search pages" />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          {(["dashboard", "admin"] as const).map((section) => {
            const entries = items.filter((item) => item.section === section);
            return entries.length ? (
              <CommandGroup
                key={section}
                heading={section === "dashboard" ? "Dashboard" : "Admin"}
              >
                {entries.map((item) => (
                  <CommandItem
                    key={`${section}:${item.href}`}
                    value={`${section} ${item.title}`}
                    onSelect={() => {
                      onOpenChange(false);
                      router.push(item.href);
                    }}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.title}</span>
                    <CommandShortcut>Go</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null;
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
