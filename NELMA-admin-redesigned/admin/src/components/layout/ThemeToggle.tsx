import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nelma.ui.theme");
      if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Choose appearance">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(
          [
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "Use device theme", icon: Monitor },
          ] as const
        ).map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={() => {
              setTheme(item.value);
              try {
                localStorage.setItem("nelma.ui.theme", item.value);
              } catch {
                /* Theme still works without storage. */
              }
              window.dispatchEvent(new CustomEvent("nelma-theme-change", { detail: item.value }));
            }}
          >
            <item.icon className="mr-2 size-4" />
            {item.label}
            <span
              className="ml-auto pl-3"
              aria-label={theme === item.value ? "Selected" : undefined}
            >
              {theme === item.value ? "✓" : ""}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
