import { parsePersisted, type StorageBackend } from "./storage";

const KEY = "tool-assistant.state";

export function localStorageBackend(): StorageBackend {
  return {
    async load() {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      try {
        return parsePersisted(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    async save(state) {
      localStorage.setItem(KEY, JSON.stringify(state));
    },
  };
}
