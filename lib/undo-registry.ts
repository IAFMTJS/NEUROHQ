"use client";

import { create } from "zustand";

const UNDO_TTL_MS = 25_000;

export type UndoEntry = {
  id: string;
  actionType: "payday_received";
  payload: { previousLastPaydayDate: string | null };
  expiresAt: number;
};

type UndoStore = {
  entry: UndoEntry | null;
  pushPaydayUndo: (previousLastPaydayDate: string | null) => string;
  remove: (id: string) => void;
  getEntry: () => UndoEntry | null;
};

export const useUndoStore = create<UndoStore>((set, get) => ({
  entry: null,
  pushPaydayUndo(previousLastPaydayDate) {
    const id = "payday-" + Date.now();
    const entry: UndoEntry = {
      id,
      actionType: "payday_received",
      payload: { previousLastPaydayDate },
      expiresAt: Date.now() + UNDO_TTL_MS,
    };
    set({ entry });
    return id;
  },
  remove(id) {
    if (get().entry?.id === id) set({ entry: null });
  },
  getEntry() {
    const e = get().entry;
    if (!e || e.expiresAt < Date.now()) return null;
    return e;
  },
}));
