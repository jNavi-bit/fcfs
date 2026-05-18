"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ProgressVariant } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type BlockedIoStrip = {
  elapsedTicks: number;
  remainingTicks: number;
  progressPct: number;
};

type ProcessCardLabels = {
  operation: string;
  progress: string;
  tme: string;
  exec: string;
  rest: string;
  blockedIoProgress?: string;
  blockedIoElapsed?: string;
  blockedIoRemaining?: string;
};

type ProcessCardProps = {
  id: number;
  headline?: string;
  opKindLabel: string;
  operationLine: string;
  resultOrPending: string;
  tme: number;
  cpuElapsed: number;
  remaining: number;
  progressPct: number;
  progressVariant?: ProgressVariant;
  blockedIo?: BlockedIoStrip;
  resultHighlight?: "none" | "success" | "error";
  statusBadge?: string;
  badgeClassName?: string;
  emphasis?: boolean;
  compact?: boolean;
  labels: ProcessCardLabels;
};

export function ProcessCard({
  id,
  headline,
  opKindLabel,
  operationLine,
  resultOrPending,
  tme,
  cpuElapsed,
  remaining,
  progressPct,
  progressVariant = "default",
  blockedIo,
  resultHighlight = "none",
  statusBadge,
  badgeClassName,
  emphasis = false,
  compact = false,
  labels,
}: ProcessCardProps) {
  const line = headline ?? `#${id}`;
  const reduceMotion = useReducedMotion();
  const cpuPct = Math.round(progressPct);
  const ioPct = blockedIo ? Math.round(blockedIo.progressPct) : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-border/40 transition-shadow duration-200",
        compact ? "p-4" : "p-5",
        emphasis &&
          "shadow-md ring-2 ring-primary/25 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="border-border flex flex-col items-center border-b pb-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {statusBadge ? (
            <Badge
              variant="outline"
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-semibold",
                badgeClassName ??
                  "border-primary/35 bg-primary/10 text-primary",
              )}
            >
              {statusBadge}
            </Badge>
          ) : null}
          <span
            className={cn(
              "text-foreground font-mono font-semibold tracking-tight",
              compact ? "text-base" : "text-lg",
            )}
          >
            {line}
          </span>
        </div>
        <p className="text-muted-foreground mt-2 max-w-full text-xs leading-snug sm:text-sm">
          {opKindLabel}
        </p>
      </div>

      <div
        className={cn(
          "border-border bg-muted/30 mt-4 rounded-xl border border-dashed px-3 py-3 text-center",
          compact ? "px-3 py-2.5" : "px-4 py-4",
        )}
      >
        <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
          {labels.operation}
        </p>
        <p
          className={cn(
            "font-mono font-medium leading-snug tracking-tight",
            compact ? "text-base" : "text-lg sm:text-xl",
            emphasis && !compact && "text-xl sm:text-2xl",
          )}
        >
          <span>{operationLine}</span>
          <span className="text-muted-foreground"> = </span>
          <span
            className={cn(
              resultHighlight === "success" &&
                "text-emerald-600 dark:text-emerald-400",
              resultHighlight === "error" && "text-destructive",
              resultHighlight === "none" && "text-muted-foreground",
            )}
          >
            {resultOrPending}
          </span>
        </p>
      </div>

      <div className={cn("mt-4 grid grid-cols-3 gap-2", compact && "gap-1.5")}>
        {[
          { label: labels.tme, value: tme },
          { label: labels.exec, value: cpuElapsed },
          { label: labels.rest, value: remaining },
        ].map((cell) => (
          <div
            key={cell.label}
            className="border-border/70 bg-muted/25 rounded-lg border px-1.5 py-2 text-center shadow-inner"
          >
            <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              {cell.label}
            </div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums sm:text-base">
              {reduceMotion ? (
                cell.value
              ) : (
                <motion.span
                  key={`${cell.label}-${cell.value}`}
                  initial={{ scale: 0.9, y: 3, opacity: 0.55 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 28,
                    mass: 0.55,
                  }}
                  className="inline-block origin-center tabular-nums"
                >
                  {cell.value}
                </motion.span>
              )}
            </div>
          </div>
        ))}
      </div>

      {blockedIo &&
      labels.blockedIoProgress &&
      labels.blockedIoElapsed &&
      labels.blockedIoRemaining ? (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="border-border/70 bg-muted/20 rounded-lg border px-2 py-2">
              <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                {labels.blockedIoElapsed}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {blockedIo.elapsedTicks}
              </div>
            </div>
            <div className="border-border/70 bg-muted/20 rounded-lg border px-2 py-2">
              <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                {labels.blockedIoRemaining}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {blockedIo.remainingTicks}
              </div>
            </div>
          </div>
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
            <span>{labels.blockedIoProgress}</span>
            {reduceMotion ? (
              <span className="font-mono text-foreground/90">{ioPct}%</span>
            ) : (
              <motion.span
                key={ioPct}
                initial={{ scale: 0.88, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 24,
                }}
                className="font-mono text-foreground/90 inline-block tabular-nums"
              >
                {ioPct}%
              </motion.span>
            )}
          </div>
          <Progress
            value={blockedIo.progressPct}
            variant="blocked"
            className="h-1.5"
          />
        </div>
      ) : (
        <div className={cn("mt-4 space-y-1.5", compact && "mt-3")}>
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
            <span>{labels.progress}</span>
            {reduceMotion ? (
              <span className="font-mono text-foreground/90">{cpuPct}%</span>
            ) : (
              <motion.span
                key={cpuPct}
                initial={{ scale: 0.88, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 24,
                }}
                className="font-mono text-foreground/90 inline-block tabular-nums"
              >
                {cpuPct}%
              </motion.span>
            )}
          </div>
          <Progress
            value={progressPct}
            variant={progressVariant}
            className="h-1.5"
          />
        </div>
      )}
    </div>
  );
}
