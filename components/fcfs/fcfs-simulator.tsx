"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Timer,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  IO_BLOCK_DURATION,
  MAX_IN_MEMORY,
  buildSimulationFromCount,
  computeMetrics,
  createInitialState,
  formatOperation,
  interruptError,
  interruptIo,
  isSimulationComplete,
  setPaused,
  tickSimulation,
  type FinishedProcess,
  type SimProcess,
  type SimulationState,
} from "@/application/scheduling";
import type { OperationKind, OperationSpec } from "@/domain/scheduling/operation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { ProcessCard } from "@/components/fcfs/process-card";
import {
  clearFcfsSimPersisted,
  loadFcfsSimPersisted,
  saveFcfsSimPersisted,
} from "@/lib/fcfs-sim-persistence";
import { cn } from "@/lib/utils";

const motionStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.03 },
  },
};

const motionItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const emptySubcardClass =
  "text-muted-foreground box-border flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-4 text-center text-sm leading-snug";

const columnTitleInHeaderClass = "mb-1.5 min-h-10";
const sectionLabelBelowTitleClass = "mb-2";
const sectionLabelInBlockClass = "mb-2";

function opLine(spec: OperationSpec): string {
  return formatOperation(spec);
}

function clampMs(v: number): number {
  if (!Number.isFinite(v)) return 550;
  return Math.min(5000, Math.max(50, Math.floor(v)));
}

function memoryUsed(s: SimulationState): number {
  return s.readyQueue.length + s.blockedQueue.length + (s.running ? 1 : 0);
}

function SettingsPanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-[0.16em]">
        {title}
      </h3>
      <div className="border-border bg-muted/20 space-y-3 rounded-lg border p-3">
        {children}
      </div>
    </section>
  );
}

function ColumnTitle({
  icon: Icon,
  title,
  className,
}: {
  icon: LucideIcon;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex shrink-0 items-center gap-3",
        className,
      )}
    >
      <div className="bg-muted text-primary border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
    </div>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="border-border overflow-hidden rounded-xl border bg-muted/10 shadow-inner">
      {children}
    </div>
  );
}

function KeyboardHelp() {
  const t = useTranslations("controls");
  const rows: { k: string; text: string }[] = [
    { k: "E", text: t("keyE") },
    { k: "W", text: t("keyW") },
    { k: "P", text: t("keyP") },
    { k: "C", text: t("keyC") },
  ];
  return (
    <section
      className="border-border bg-card mt-6 rounded-2xl border p-4 shadow-sm ring-1 ring-border/30 sm:p-5"
      aria-labelledby="kbd-help-title"
    >
      <h2
        id="kbd-help-title"
        className="text-foreground text-sm font-semibold tracking-tight"
      >
        {t("keysTitle")}
      </h2>
      <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.k} className="flex gap-3">
            <kbd className="border-border bg-muted text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold shadow-sm">
              {row.k}
            </kbd>
            <span className="text-muted-foreground leading-snug">{row.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const sectionLabelClass =
  "text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]";

function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn(sectionLabelClass, className)}>{children}</p>;
}

function PrimaryColumnHeader({
  icon,
  title,
  sectionLabel,
}: {
  icon: LucideIcon;
  title: string;
  sectionLabel: string;
}) {
  return (
    <header className="shrink-0">
      <ColumnTitle icon={icon} title={title} className={columnTitleInHeaderClass} />
      <SectionLabel className={sectionLabelBelowTitleClass}>
        {sectionLabel}
      </SectionLabel>
    </header>
  );
}

function EmptySubcard({ children }: { children: ReactNode }) {
  return (
    <p role="status" className={emptySubcardClass}>
      {children}
    </p>
  );
}

function ColumnSection({
  label,
  children,
  hideLabel,
}: {
  label: string;
  children: ReactNode;
  hideLabel?: boolean;
}) {
  return (
    <section>
      {hideLabel ? null : (
        <SectionLabel className={sectionLabelInBlockClass}>{label}</SectionLabel>
      )}
      {children}
    </section>
  );
}

export function FcfsSimulator() {
  const tApp = useTranslations("app");
  const tDash = useTranslations("dashboard");
  const tOp = useTranslations("opKinds");
  const tQ = useTranslations("queues");
  const tC = useTranslations("controls");
  const tS = useTranslations("summary");
  const tLoc = useTranslations("locale");
  const tTheme = useTranslations("theme");

  const stateRef = useRef<SimulationState>(createInitialState());
  const [, dispatchRender] = useReducer((x: number) => x + 1, 0);
  const startedRef = useRef(false);
  const uiRef = useRef({
    inputN: "8",
    tickMs: "550",
  });
  const persistSnapshot = useRef(() => {});

  const [started, setStarted] = useState(false);
  const [inputN, setInputN] = useState("8");
  const [tickMs, setTickMs] = useState("550");
  const reduceMotion = useReducedMotion();

  startedRef.current = started;
  uiRef.current = { inputN, tickMs };

  persistSnapshot.current = () => {
    if (typeof window === "undefined") return;
    if (!startedRef.current) {
      clearFcfsSimPersisted();
      return;
    }
    saveFcfsSimPersisted({
      v: 1,
      sim: stateRef.current,
      started: true,
      inputN: uiRef.current.inputN,
      tickMs: uiRef.current.tickMs,
    });
  };

  const force = useCallback(() => {
    dispatchRender();
    queueMicrotask(() => persistSnapshot.current());
  }, []);

  useLayoutEffect(() => {
    const p = loadFcfsSimPersisted();
    if (!p?.started) return;
    stateRef.current = p.sim;
    startedRef.current = true;
    setStarted(true);
    setInputN(p.inputN);
    setTickMs(p.tickMs);
    dispatchRender();
  }, []);

  const snapshot = stateRef.current;
  const complete = isSimulationComplete(snapshot);
  const mem = memoryUsed(snapshot);

  const cardLabels = {
    operation: tDash("opBlock"),
    progress: tDash("progressCpu"),
    tme: tQ("tme"),
    exec: tDash("execShort"),
    rest: tDash("statRest"),
  };

  const tipo = (kind: OperationKind) =>
    `${tDash("typePrefix")} ${tOp(kind)}`;

  const procHeadline = (id: number) => tDash("processRef", { id });

  useEffect(() => {
    if (!started || complete) return;
    const ms = clampMs(Number(tickMs));
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (s.paused || isSimulationComplete(s)) return;
      tickSimulation(s);
      force();
    }, ms);
    return () => window.clearInterval(id);
  }, [started, complete, force, tickMs]);

  useEffect(() => {
    if (!started) return;
    if (isSimulationComplete(stateRef.current) && !stateRef.current.paused) {
      setPaused(stateRef.current, true);
      force();
    }
  }, [started, complete, force]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const k = e.key.toLowerCase();
      if (k === "p") {
        setPaused(stateRef.current, true);
        force();
      }
      if (k === "c") {
        setPaused(stateRef.current, false);
        force();
      }
      if (k === "e") {
        interruptIo(stateRef.current);
        force();
      }
      if (k === "w") {
        interruptError(stateRef.current);
        force();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [force]);

  const onStart = () => {
    const n = Math.floor(Number(inputN));
    if (!Number.isFinite(n) || n < 1 || n > 64) return;
    stateRef.current = buildSimulationFromCount(n);
    startedRef.current = true;
    setStarted(true);
    force();
  };

  const onReset = () => {
    stateRef.current = createInitialState();
    startedRef.current = false;
    setStarted(false);
    clearFcfsSimPersisted();
    force();
  };

  const togglePause = () => {
    if (!started || complete) return;
    const s = stateRef.current;
    setPaused(s, !s.paused);
    force();
  };

  const finishedSorted = [...snapshot.finished].sort((a, b) => a.id - b.id);
  const metricsRows = finishedSorted.map((f) => computeMetrics(f));
  const newSorted = [...snapshot.newQueue].sort((a, b) => a.id - b.id);
  const tableHeadClass =
    "text-muted-foreground h-11 text-xs font-semibold uppercase tracking-wide";
  const rowHover = "border-border/40 transition-colors hover:bg-muted/40";

  const liveCard = (p: SimProcess, variant: "new" | "ready" | "blocked") => {
    const rest = Math.max(0, p.tme - p.cpuElapsed);
    const cpuProgress = p.tme > 0 ? (p.cpuElapsed / p.tme) * 100 : 0;
    const ioProgress =
      IO_BLOCK_DURATION > 0
        ? (p.blockedSessionTicks / IO_BLOCK_DURATION) * 100
        : 0;
    const ioRemaining = Math.max(0, IO_BLOCK_DURATION - p.blockedSessionTicks);

    const badgeLabel =
      variant === "new"
        ? tDash("badgeNew")
        : variant === "ready"
          ? tDash("badgeReady")
          : tDash("badgeBlocked");
    const badgeClass =
      variant === "new"
        ? "border-border bg-muted/50 text-muted-foreground"
        : variant === "ready"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-orange-500/40 bg-orange-500/10 text-orange-900 dark:text-orange-200";

    const labelsForCard =
      variant === "blocked"
        ? {
            ...cardLabels,
            blockedIoProgress: tDash("blockedIoProgress"),
            blockedIoElapsed: tDash("blockedIoElapsed"),
            blockedIoRemaining: tDash("blockedIoRemaining"),
          }
        : cardLabels;

    return (
      <ProcessCard
        key={`${variant}-${p.id}`}
        id={p.id}
        headline={procHeadline(p.id)}
        opKindLabel={tipo(p.operation.kind)}
        operationLine={opLine(p.operation)}
        resultOrPending="?"
        tme={p.tme}
        cpuElapsed={p.cpuElapsed}
        remaining={rest}
        progressPct={cpuProgress}
        progressVariant="default"
        blockedIo={
          variant === "blocked"
            ? {
                elapsedTicks: p.blockedSessionTicks,
                remainingTicks: ioRemaining,
                progressPct: ioProgress,
              }
            : undefined
        }
        statusBadge={badgeLabel}
        badgeClassName={badgeClass}
        state={variant}
        compact
        labels={labelsForCard}
      />
    );
  };

  const runningCard = () => {
    const p = snapshot.running;
    if (!p) return null;
    return (
      <ProcessCard
        id={p.id}
        headline={procHeadline(p.id)}
        opKindLabel={tipo(p.operation.kind)}
        operationLine={opLine(p.operation)}
        resultOrPending="?"
        tme={p.tme}
        cpuElapsed={p.cpuElapsed}
        remaining={Math.max(0, p.tme - p.cpuElapsed)}
        progressPct={p.tme > 0 ? (p.cpuElapsed / p.tme) * 100 : 0}
        progressVariant="default"
        statusBadge={tDash("badgeCpu")}
        state="running"
        compact
        labels={cardLabels}
      />
    );
  };

  const finishedCard = (f: FinishedProcess) => {
    const err = f.termination === "error";
    const rest = err ? Math.max(0, f.tme - f.cpuElapsed) : 0;
    const progress = err
      ? f.tme > 0
        ? (f.cpuElapsed / f.tme) * 100
        : 0
      : 100;
    return (
      <ProcessCard
        key={`done-${f.id}`}
        id={f.id}
        headline={procHeadline(f.id)}
        opKindLabel={tipo(f.operation.kind)}
        operationLine={f.operationLabel}
        resultOrPending={
          err || f.resultDisplay === "ERROR" ? tS("error") : f.resultDisplay
        }
        tme={f.tme}
        cpuElapsed={f.cpuElapsed}
        remaining={rest}
        progressPct={progress}
        progressVariant={err ? "error" : "success"}
        resultHighlight={err ? "error" : "success"}
        statusBadge={err ? tDash("badgeError") : tDash("badgeDone")}
        badgeClassName={
          err
            ? "border-destructive/50 bg-destructive/10 text-destructive"
            : "border-emerald-600/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
        }
        state={err ? "error" : "done"}
        compact
        labels={cardLabels}
      />
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_70%_at_50%_-25%,hsl(var(--primary)/0.09),transparent)]"
        aria-hidden
      />

      <header className="border-border bg-card/90 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="border-primary/25 bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm">
                <Activity className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                  <span>{tDash("brand")}</span>
                  <span className="text-muted-foreground/70">{tDash("dot")}</span>{" "}
                  <span>{tDash("product")}</span>
                </p>
                <h1 className="text-foreground text-base font-semibold tracking-tight sm:text-lg">
                  {tApp("title")}
                </h1>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-1 sm:flex-nowrap sm:justify-end">
              <div
                className="border-border bg-background flex h-9 min-w-0 shrink-0 items-center gap-2 rounded-xl border px-2.5 shadow-sm sm:px-3"
                title={tDash("globalClock")}
              >
                <Timer className="text-primary h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <div className="flex min-w-0 flex-col justify-center leading-none">
                  <span className="text-muted-foreground truncate text-[8px] font-semibold uppercase tracking-wide sm:text-[9px]">
                    {tDash("globalClock")}
                  </span>
                  <div className="mt-0.5 flex justify-start">
                    {reduceMotion ? (
                      <span className="font-mono text-sm font-bold tabular-nums leading-none sm:text-base">
                        {snapshot.globalClock}
                      </span>
                    ) : (
                      <motion.span
                        key={snapshot.globalClock}
                        initial={false}
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{
                          duration: 0.42,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="inline-block origin-left font-mono text-sm font-bold tabular-nums leading-none sm:text-base"
                      >
                        {snapshot.globalClock}
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={!started || complete}
                  onClick={togglePause}
                  className="h-9 w-9 shrink-0 rounded-full"
                  aria-label={snapshot.paused ? tDash("resume") : tDash("pause")}
                >
                  {snapshot.paused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={onReset}
                  className="h-9 w-9 shrink-0 rounded-full"
                  aria-label={tC("reset")}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                size="default"
                onClick={onStart}
                disabled={started && !complete}
                className="h-9 shrink-0 rounded-xl px-4 shadow-sm"
              >
                <Play className="mr-1.5 inline h-4 w-4" />
                {tC("start")}
              </Button>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border bg-background text-foreground hover:bg-muted h-9 shrink-0 gap-2 rounded-xl px-3 shadow-sm"
                    aria-label={tDash("headerMore")}
                  >
                    <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="max-w-[7rem] truncate text-sm font-medium sm:max-w-[9rem]">
                      {tDash("headerMore")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="border-border bg-popover text-popover-foreground w-[min(calc(100vw-2rem),18rem)] overflow-hidden rounded-xl p-0 shadow-lg"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div
                    className="border-border border-b px-3 py-2.5"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-semibold leading-none">
                      {tDash("headerMore")}
                    </p>
                  </div>
                  <div
                    className="space-y-4 p-3"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <SettingsPanelSection title={tDash("settingsSectionSim")}>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="n-proc"
                          className="text-muted-foreground text-xs font-medium"
                        >
                          {tC("initialProcessCount")}
                        </Label>
                        <Input
                          id="n-proc"
                          type="number"
                          min={1}
                          max={64}
                          value={inputN}
                          onChange={(e) => setInputN(e.target.value)}
                          disabled={started && !complete}
                          className="bg-background h-9 w-full rounded-lg border font-mono text-sm shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="tick-ms"
                          className="text-muted-foreground text-xs font-medium"
                        >
                          {tDash("tickMsLabel")}
                        </Label>
                        <div className="border-border bg-background flex h-9 items-center gap-2 rounded-lg border px-2 shadow-sm">
                          <Timer
                            className="text-primary h-4 w-4 shrink-0"
                            aria-hidden
                          />
                          <Input
                            id="tick-ms"
                            type="number"
                            min={50}
                            max={5000}
                            step={50}
                            value={tickMs}
                            onChange={(e) => setTickMs(e.target.value)}
                            className="h-8 min-w-0 flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
                          />
                          <span className="text-muted-foreground shrink-0 text-[10px] font-medium">
                            ms
                          </span>
                        </div>
                      </div>
                    </SettingsPanelSection>

                    <SettingsPanelSection title={tLoc("label")}>
                      <LocaleSwitcher variant="settings" />
                    </SettingsPanelSection>

                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs font-medium">
                        {tTheme("label")}
                      </p>
                      <ModeToggle variant="inline" />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {started ? (
          <div className="border-border bg-muted/30 border-t px-4 py-2">
            <div className="text-muted-foreground mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-xs sm:text-sm">
              {snapshot.paused ? (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  {tC("paused")}
                </span>
              ) : !complete ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {tC("running")}
                </span>
              ) : (
                <span>{tC("finished")}</span>
              )}
              <span aria-hidden className="text-muted-foreground/50">
                ·
              </span>
              <span>{tDash("memoryLine", { used: mem, max: MAX_IN_MEMORY })}</span>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          {tApp("subtitle")}
        </p>

        <motion.div
          variants={motionStagger}
          initial="hidden"
          animate="show"
          className="grid items-start gap-6 lg:grid-cols-3 lg:gap-7"
        >
          <motion.section
            variants={motionItem}
            className="border-border bg-card flex w-full flex-col self-start rounded-2xl border p-4 shadow-sm ring-1 ring-border/30 sm:p-5"
          >
            <PrimaryColumnHeader
              icon={Layers}
              title={tDash("columnNew")}
              sectionLabel={tDash("legendNew")}
            />
            <ScrollArea>
              <div className="pb-2">
                {newSorted.length === 0 ? (
                  <EmptySubcard>{tDash("emptyNew")}</EmptySubcard>
                ) : (
                  <div className="space-y-3">
                    {newSorted.map((p) => liveCard(p, "new"))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.section>

          <motion.section
            variants={motionItem}
            className="border-border bg-card flex w-full flex-col self-start rounded-2xl border p-4 shadow-sm ring-1 ring-border/30 sm:p-5"
          >
            <PrimaryColumnHeader
              icon={Cpu}
              title={tDash("columnMemory")}
              sectionLabel={tQ("running")}
            />
            <ScrollArea>
              <div className="space-y-8 pb-2">
                <ColumnSection label={tQ("running")} hideLabel>
                  {snapshot.running ? (
                    runningCard()
                  ) : (
                    <EmptySubcard>{tDash("cpuIdle")}</EmptySubcard>
                  )}
                </ColumnSection>
                <ColumnSection label={tDash("groupReady")}>
                  {snapshot.readyQueue.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.readyQueue.map((p) => liveCard(p, "ready"))}
                    </div>
                  ) : (
                    <EmptySubcard>{tDash("emptyReady")}</EmptySubcard>
                  )}
                </ColumnSection>
                <ColumnSection label={tQ("blocked")}>
                  {snapshot.blockedQueue.length > 0 ? (
                    <div className="space-y-3">
                      {snapshot.blockedQueue.map((p) =>
                        liveCard(p, "blocked"),
                      )}
                    </div>
                  ) : (
                    <EmptySubcard>{tDash("emptyBlocked")}</EmptySubcard>
                  )}
                </ColumnSection>
              </div>
            </ScrollArea>
          </motion.section>

          <motion.section
            variants={motionItem}
            className="border-border bg-card flex w-full flex-col self-start rounded-2xl border p-4 shadow-sm ring-1 ring-border/30 sm:p-5"
          >
            <PrimaryColumnHeader
              icon={CheckCircle2}
              title={tQ("terminated")}
              sectionLabel={tDash("legendDone")}
            />
            <ScrollArea>
              <div className="pb-2">
                {finishedSorted.length === 0 ? (
                  <EmptySubcard>{tDash("emptyDone")}</EmptySubcard>
                ) : (
                  <div className="space-y-3">
                    {finishedSorted.map((f) => finishedCard(f))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.section>
        </motion.div>

        {complete && started ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <Separator className="bg-border" />
            <div className="border-border bg-card rounded-2xl border p-4 shadow-sm ring-1 ring-border/30 sm:p-5">
              <h3 className="text-foreground text-base font-semibold tracking-tight">
                {tS("title")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">{tS("description")}</p>
              <ScrollArea className="mt-4 max-h-[min(70vh,480px)] w-full">
                <TableShell>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className={tableHeadClass}>
                          {tS("programId")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("outcome")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tQ("operation")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tQ("tme")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tQ("result")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("arrival")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("finish")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("turnaround")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("response")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("wait")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("service")}
                        </TableHead>
                        <TableHead className={tableHeadClass}>
                          {tS("blocked")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metricsRows.map((m) => (
                        <TableRow key={m.id} className={rowHover}>
                          <TableCell className="font-mono font-medium">
                            {m.id}
                          </TableCell>
                          <TableCell>
                            {m.finishedNormally ? tS("normal") : tS("error")}
                          </TableCell>
                          <TableCell className="max-w-[8rem] truncate font-mono text-xs">
                            {m.operationLabel}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.tme}
                          </TableCell>
                          <TableCell className="font-mono">
                            {m.finishedNormally
                              ? m.resultDisplay
                              : tS("error")}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.arrivalTick}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.finishTick}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.turnaround}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.response}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.wait}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.service}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {m.blocked}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableShell>
              </ScrollArea>
            </div>
          </motion.div>
        ) : null}

        <KeyboardHelp />
      </main>
    </div>
  );
}
