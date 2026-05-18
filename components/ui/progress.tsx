"use client";

import { cn } from "@/lib/utils";

export type ProgressVariant = "default" | "blocked" | "success" | "error";

type ProgressProps = {
  value: number;
  className?: string;
  variant?: ProgressVariant;
};

const BAR: Record<ProgressVariant, string> = {
  default:
    "bg-gradient-to-r from-primary via-sky-500 to-cyan-600 dark:from-primary dark:via-sky-400 dark:to-cyan-500",
  blocked:
    "bg-gradient-to-r from-amber-400 via-orange-500 to-orange-700 dark:from-amber-500 dark:via-orange-500 dark:to-orange-600",
  success:
    "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-500 dark:to-emerald-600",
  error:
    "bg-gradient-to-r from-orange-500 via-red-500 to-red-700 dark:from-orange-400 dark:via-red-500 dark:to-red-600",
};

export function Progress({
  value,
  className,
  variant = "default",
}: ProgressProps) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          BAR[variant],
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
