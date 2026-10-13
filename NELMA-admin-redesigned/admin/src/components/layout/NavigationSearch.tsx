import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowUpRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { navigationFor } from "@/lib/nav";
import { useAuth } from "@/hooks/useAuth";

export function NavigationSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, can } = useAuth();
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search pages (Control or Command K)"
        className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="hidden xl:inline">Search pages…</span>
        <kbd className="ml-8 hidden rounded border border-border bg-card px-1.5 py-0.5 text-xs xl:inline">
          ⌘ / Ctrl K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search workspace pages</DialogTitle>
        <DialogDescription className="sr-only">
          Find a page, then press Enter to open it.
        </DialogDescription>
        <CommandInput aria-label="Search pages" placeholder="Where would you like to go?" />
        <CommandList>
          <CommandEmpty>No matching pages. Try “orders” or “drivers”.</CommandEmpty>
          <CommandGroup heading="Your workspace">
            {user &&
              navigationFor(user.role)
                .filter((item) => can(item.permission))
                .map((item) => (
                  <CommandItem
                    key={item.to}
                    value={item.label}
                    onSelect={() => {
                      setOpen(false);
                      navigate({ to: item.to as "/dashboard" });
                    }}
                  >
                    <item.icon className="mr-2 size-4" />
                    {item.label}
                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                  </CommandItem>
                ))}
          </CommandGroup>
        </CommandList>
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          ↑ ↓ to navigate · Enter to open · Esc to close
        </p>
      </CommandDialog>
    </>
  );
}
