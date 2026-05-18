"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  es: "ES",
  en: "EN",
  de: "DE",
};

const localeNameKey = (loc: string) =>
  `name_${loc}` as "name_es" | "name_en" | "name_de";

type LocaleSwitcherProps = {
  variant?: "default" | "dashboard" | "dashboardGlobe";
};

export function LocaleSwitcher({ variant = "default" }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("locale");
  const dash = variant === "dashboard" || variant === "dashboardGlobe";
  const globe = variant === "dashboardGlobe";

  if (globe) {
    const currentName = t(localeNameKey(locale));

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 gap-2 rounded-xl border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted",
            )}
            aria-label={t("label")}
          >
            <Globe className="text-primary h-4 w-4" aria-hidden />
            <span className="max-w-[7rem] truncate">{currentName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-border bg-popover text-popover-foreground min-w-[10rem]"
        >
          {routing.locales.map((loc) => (
            <DropdownMenuItem key={loc} asChild>
              <Link
                href={pathname}
                locale={loc}
                className={cn(
                  "cursor-pointer",
                  locale === loc && "bg-muted font-medium text-foreground",
                )}
              >
                {t(localeNameKey(loc))}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border p-1",
        dash ? "border-border bg-muted/40" : "border-border bg-background",
      )}
    >
      <span className="sr-only">{t("label")}</span>
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            locale === loc
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {labels[loc] ?? loc}
        </Link>
      ))}
    </div>
  );
}
