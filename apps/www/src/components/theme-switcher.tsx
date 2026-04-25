import { LaptopMinimalIcon, MoonIcon, SunIcon } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

export function ThemeSwitcher() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    return (window.localStorage.getItem("theme") as Theme | null) ?? "system";
  });

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const useDark = theme === "dark" || (theme === "system" && prefersDark);

    document.documentElement.classList.toggle("dark", useDark);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  function setTheme(value: Theme) {
    setThemeState(value);
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-haspopup="menu"
          aria-label="Alternar tema"
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          data-testid="theme-toggle"
        >
          <SunIcon
            aria-hidden
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
          />
          <MoonIcon
            aria-hidden
            className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-testid="theme-menu">
        <DropdownMenuItem
          role="menuitem"
          data-testid="theme-light"
          onClick={() => setTheme("light")}
        >
          <SunIcon aria-hidden /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem
          role="menuitem"
          data-testid="theme-dark"
          onClick={() => setTheme("dark")}
        >
          <MoonIcon aria-hidden /> Escuro
        </DropdownMenuItem>
        <DropdownMenuItem
          role="menuitem"
          data-testid="theme-system"
          onClick={() => setTheme("system")}
        >
          <LaptopMinimalIcon aria-hidden /> Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
