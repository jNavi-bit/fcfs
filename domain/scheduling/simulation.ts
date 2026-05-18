import type { OperationSpec } from "./operation";
import { evaluateOperation, formatOperation, generateRandomOperation } from "./operation";

export const MAX_IN_MEMORY = 4;
export const IO_BLOCK_DURATION = 8;
export const TME_MIN = 6;
export const TME_MAX = 20;

export type TerminationKind = "normal" | "error";

export type SimProcess = {
  id: number;
  tme: number;
  operation: OperationSpec;
  arrivalTick: number;
  cpuElapsed: number;
  blockedSessionTicks: number;
  blockedTotalTicks: number;
  readyWaitTicks: number;
  firstCpuStartTick: number | null;
  finishTick: number | null;
  termination: TerminationKind | null;
};

export type FinishedProcess = SimProcess & {
  finishTick: number;
  termination: TerminationKind;
  resultDisplay: string;
  operationLabel: string;
};

export type SimulationState = {
  globalClock: number;
  paused: boolean;
  newQueue: SimProcess[];
  readyQueue: SimProcess[];
  blockedQueue: SimProcess[];
  running: SimProcess | null;
  finished: FinishedProcess[];
  allProcesses: SimProcess[];
};

export function createInitialState(): SimulationState {
  return {
    globalClock: 0,
    paused: false,
    newQueue: [],
    readyQueue: [],
    blockedQueue: [],
    running: null,
    finished: [],
    allProcesses: [],
  };
}

function memoryCount(s: SimulationState): number {
  return (
    s.readyQueue.length +
    s.blockedQueue.length +
    (s.running ? 1 : 0)
  );
}

function admitFromNew(s: SimulationState): void {
  while (s.newQueue.length > 0 && memoryCount(s) < MAX_IN_MEMORY) {
    const next = s.newQueue.shift()!;
    s.readyQueue.push(next);
  }
}

function dispatchCpu(s: SimulationState, quantumTime: number): void {
  if (s.running || s.readyQueue.length === 0) return;
  const next = s.readyQueue.shift()!;
  if (next.firstCpuStartTick === null) {
    next.firstCpuStartTick = quantumTime;
  }
  s.running = next;
}

function pushFinished(
  s: SimulationState,
  proc: SimProcess,
  termination: TerminationKind,
  finishTick: number,
): void {
  const opRes =
    termination === "normal"
      ? evaluateOperation(proc.operation)
      : ({ ok: false } as const);
  let resultDisplay: string;
  if (termination === "error") {
    resultDisplay = "ERROR";
  } else if (opRes.ok) {
    resultDisplay = String(opRes.value);
  } else {
    resultDisplay = "ERROR";
  }

  const finished: FinishedProcess = {
    ...proc,
    finishTick,
    termination,
    resultDisplay,
    operationLabel: formatOperation(proc.operation),
  };
  s.finished.push(finished);
}

export function buildSimulationFromCount(count: number): SimulationState {
  const all: SimProcess[] = [];
  for (let i = 1; i <= count; i++) {
    const tme =
      Math.floor(Math.random() * (TME_MAX - TME_MIN + 1)) + TME_MIN;
    all.push({
      id: i,
      tme,
      operation: generateRandomOperation(),
      arrivalTick: 0,
      cpuElapsed: 0,
      blockedSessionTicks: 0,
      blockedTotalTicks: 0,
      readyWaitTicks: 0,
      firstCpuStartTick: null,
      finishTick: null,
      termination: null,
    });
  }

  const state: SimulationState = {
    globalClock: 0,
    paused: false,
    newQueue: [...all],
    readyQueue: [],
    blockedQueue: [],
    running: null,
    finished: [],
    allProcesses: all,
  };

  admitFromNew(state);
  dispatchCpu(state, 0);
  return state;
}

export function isSimulationComplete(s: SimulationState): boolean {
  return s.finished.length === s.allProcesses.length;
}

export function tickSimulation(s: SimulationState): void {
  if (s.paused || isSimulationComplete(s)) return;
  const t = s.globalClock;

  const stillBlocked: SimProcess[] = [];
  for (const p of s.blockedQueue) {
    p.blockedSessionTicks += 1;
    p.blockedTotalTicks += 1;
    if (p.blockedSessionTicks >= IO_BLOCK_DURATION) {
      p.blockedSessionTicks = 0;
      s.readyQueue.push(p);
    } else {
      stillBlocked.push(p);
    }
  }
  s.blockedQueue = stillBlocked;

  admitFromNew(s);
  if (!s.running) {
    dispatchCpu(s, t);
  }

  for (const p of s.readyQueue) {
    p.readyWaitTicks += 1;
  }

  if (s.running) {
    s.running.cpuElapsed += 1;
    if (s.running.cpuElapsed >= s.running.tme) {
      const proc = s.running;
      s.running = null;
      pushFinished(s, proc, "normal", t + 1);
      admitFromNew(s);
      if (!s.running) {
        dispatchCpu(s, t + 1);
      }
    }
  }

  s.globalClock = t + 1;
}

export function interruptIo(s: SimulationState): void {
  if (s.paused || !s.running) return;
  const proc = s.running;
  s.running = null;
  proc.blockedSessionTicks = 0;
  s.blockedQueue.push(proc);
  dispatchCpu(s, s.globalClock);
}

export function interruptError(s: SimulationState): void {
  if (s.paused || !s.running) return;
  const proc = s.running;
  s.running = null;
  pushFinished(s, proc, "error", s.globalClock);
  admitFromNew(s);
  dispatchCpu(s, s.globalClock);
}

export function setPaused(s: SimulationState, paused: boolean): void {
  s.paused = paused;
}

export type ProcessMetrics = {
  id: number;
  arrivalTick: number;
  finishTick: number;
  turnaround: number;
  response: number;
  wait: number;
  service: number;
  blocked: number;
  termination: TerminationKind;
  tme: number;
  operationLabel: string;
  resultDisplay: string;
  finishedNormally: boolean;
};

export function computeMetrics(f: FinishedProcess): ProcessMetrics {
  const { finishTick, arrivalTick, firstCpuStartTick, cpuElapsed, readyWaitTicks, blockedTotalTicks, termination, tme, operationLabel, resultDisplay } = f;
  const turnaround = finishTick - arrivalTick;
  const first = firstCpuStartTick ?? finishTick;
  const response = first - arrivalTick;
  return {
    id: f.id,
    arrivalTick,
    finishTick,
    turnaround,
    response,
    wait: readyWaitTicks,
    service: cpuElapsed,
    blocked: blockedTotalTicks,
    termination,
    tme,
    operationLabel,
    resultDisplay,
    finishedNormally: termination === "normal",
  };
}
