import { SAVE_KEY, sanitizeState } from "@/src/game/gameState";
import type { GameState } from "@/src/game/types";

export function hasSave(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SAVE_KEY) !== null;
}

export function saveGame(state: GameState): void {
  if (typeof window === "undefined") return;
  const payload = { ...state, lastSavedAt: Date.now() };
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return sanitizeState(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
}
