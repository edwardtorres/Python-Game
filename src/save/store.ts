// localStorage adapter. Every access is wrapped: storage can be missing, blocked,
// full, or throw in private windows. The game still works without it.
import { migrateSave, type MigrationResult } from './migrate';
import { SAVE_KEY, type SaveV2 } from './schema';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SaveStore {
  load(now: string): MigrationResult & { persistent: boolean };
  write(save: SaveV2): { ok: boolean };
}

export function createSaveStore(storage: StorageLike | null, key = SAVE_KEY): SaveStore {
  return {
    load(now) {
      if (storage === null) return { save: migrateSave(null, now).save, notice: null, backupReason: null, persistent: false };
      let text: string | null;
      try {
        text = storage.getItem(key);
      } catch {
        return { save: migrateSave(null, now).save, notice: 'Progress cannot be saved in this browser, so it will reset when you leave.', backupReason: null, persistent: false };
      }
      const result = migrateSave(text, now);
      if (result.backupReason !== null && text !== null) {
        try {
          storage.setItem(`${key}.backup`, text);
        } catch {
          // The backup is best effort.
        }
      }
      return { ...result, persistent: true };
    },
    write(save) {
      if (storage === null) return { ok: false };
      try {
        storage.setItem(key, JSON.stringify(save));
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },
  };
}

export function browserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
