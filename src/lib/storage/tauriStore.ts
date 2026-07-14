import { load, type Store } from "@tauri-apps/plugin-store";
import { parsePersisted, type PersistedState, type StorageBackend } from "./storage";

const FILE = "tool-assistant.json";
const KEY = "state";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  storePromise ??= load(FILE, { autoSave: false, defaults: {} });
  return storePromise;
}

export function tauriStoreBackend(): StorageBackend {
  return {
    async load() {
      const store = await getStore();
      return parsePersisted(await store.get<PersistedState>(KEY));
    },
    async save(state) {
      const store = await getStore();
      await store.set(KEY, state);
      await store.save();
    },
  };
}
