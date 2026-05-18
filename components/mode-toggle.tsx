"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ModeToggleProps = {
  variant?: "default" | "dashboard" | "inline";
};

export function ModeToggle({ variant = "default" }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const dash = variant === "dashboard";

  if (variant === "inline") {
    const opts = [
      { name: "light" as const, icon: Sun },
      { name: "dark" as const, icon: Moon },
      { name: "system" as const, icon: Monitor },
    ];
    return (
      <div
        className="border-border bg-muted/30 flex flex-wrap gap-1 rounded-lg border p-1"
        role="group"
        aria-label={t("label")}
      >
        {opts.map(({ name, icon: Icon }) => (
          <Button
            key={name}
            type="button"
            variant={theme === name ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-8 flex-1 gap-1.5 px-2 text-xs font-medium sm:min-w-[5.25rem]",
              theme === name && "shadow-sm",
            )}
            onClick={() => setTheme(name)}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{t(name)}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "relative",
            dash &&
              "border-border bg-card text-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label={t("label")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={dash ? "border-border bg-popover text-popover-foreground" : undefined}
      >
        <DropdownMenuItem
          className={dash ? "focus:bg-muted focus:text-foreground" : undefined}
          onClick={() => setTheme("light")}
        >
          <Sun className="mr-2 h-4 w-4" />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={dash ? "focus:bg-muted focus:text-foreground" : undefined}
          onClick={() => setTheme("dark")}
        >
          <Moon className="mr-2 h-4 w-4" />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={dash ? "focus:bg-muted focus:text-foreground" : undefined}
          onClick={() => setTheme("system")}
        >
          <Monitor className="mr-2 h-4 w-4" />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
