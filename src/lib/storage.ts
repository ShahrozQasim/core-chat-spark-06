// Tiny typed localStorage wrapper. SSR-safe.

const PREFIX = "corechat:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PREFIX + key);
  },
};

export const STORAGE_KEYS = {
  user: "user",
  chats: "chats",
  personalities: "personalities",
  settings: "settings",
} as const;
