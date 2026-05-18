import type { SimulationState } from "@/application/scheduling";

export const FCFS_SIM_STORAGE_KEY = "fcfs-sim-session-v1";

export type FcfsSimPersisted = {
  v: 1;
  sim: SimulationState;
  started: boolean;
  inputN: string;
  tickMs: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isSimulationStateShape(sim: unknown): sim is SimulationState {
  if (!isRecord(sim)) return false;
  return (
    typeof sim.globalClock === "number" &&
    typeof sim.paused === "boolean" &&
    Array.isArray(sim.newQueue) &&
    Array.isArray(sim.readyQueue) &&
    Array.isArray(sim.blockedQueue) &&
    Array.isArray(sim.finished) &&
    Array.isArray(sim.allProcesses)
  );
}

export function loadFcfsSimPersisted(): FcfsSimPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FCFS_SIM_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!isRecord(data)) return null;
    if (data.v !== 1) return null;
    if (!isSimulationStateShape(data.sim)) return null;
    if (typeof data.started !== "boolean") return null;
    if (typeof data.inputN !== "string") return null;
    if (typeof data.tickMs !== "string") return null;
    return {
      v: 1,
      sim: data.sim,
      started: data.started,
      inputN: data.inputN,
      tickMs: data.tickMs,
    };
  } catch {
    return null;
  }
}

export function saveFcfsSimPersisted(p: FcfsSimPersisted): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FCFS_SIM_STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function clearFcfsSimPersisted(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FCFS_SIM_STORAGE_KEY);
  } catch {}
}
