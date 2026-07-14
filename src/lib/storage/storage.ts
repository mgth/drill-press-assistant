import type { Machine } from "$lib/domain/machine";

export interface AdvisorSettings {
  materialId: string;
  diameterMm: number;
  carbide: boolean;
  /** Vc fixée à la main (m/min), absente/null = dérivée du matériau. */
  vcOverride?: number | null;
}

export interface PersistedState {
  /** Incrémenter et migrer dans parsePersisted() en cas de changement de schéma. */
  version: 1;
  machines: Machine[];
  currentMachineId: string | null;
  lastAdvisor: AdvisorSettings | null;
}

export interface StorageBackend {
  load(): Promise<PersistedState | null>;
  save(state: PersistedState): Promise<void>;
}

export function parsePersisted(raw: unknown): PersistedState | null {
  if (!raw || typeof raw !== "object") return null;
  const state = raw as PersistedState;
  if (state.version !== 1 || !Array.isArray(state.machines)) return null;
  return state;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** plugin-store sous Tauri (fichier dans appDataDir), localStorage en navigateur pur. */
export async function getBackend(): Promise<StorageBackend> {
  if (isTauri()) return (await import("./tauriStore")).tauriStoreBackend();
  return (await import("./localStorageBackend")).localStorageBackend();
}
