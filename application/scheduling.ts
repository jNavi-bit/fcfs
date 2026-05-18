/**
 * Capa de aplicación: orquesta reglas de negocio del dominio de planificación.
 * La UI debe preferir importar desde aquí para mantener el acoplamiento explícito.
 */
export {
  buildSimulationFromCount,
  computeMetrics,
  createInitialState,
  interruptError,
  interruptIo,
  isSimulationComplete,
  setPaused,
  tickSimulation,
  MAX_IN_MEMORY,
  IO_BLOCK_DURATION,
  TME_MIN,
  TME_MAX,
  type FinishedProcess,
  type ProcessMetrics,
  type SimProcess,
  type SimulationState,
  type TerminationKind,
} from "@/domain/scheduling/simulation";

export {
  evaluateOperation,
  formatOperation,
  generateRandomOperation,
  type OperationKind,
  type OperationSpec,
} from "@/domain/scheduling/operation";
