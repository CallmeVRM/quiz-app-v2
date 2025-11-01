import { create } from "zustand";

export type LearnSelection = {
  theme: string | null;
  subcategories: string[]; // tokens "category::sub"
};

type LearnState = {
  selection: LearnSelection;
  locked: boolean;
  setSelection: (s: LearnSelection) => void;
  lock: () => void;
  reset: () => void;
  shouldRestore: () => boolean;
  markRestored: () => void;
};

const RESTORE_KEY = "flash_restore_flag";

export const useLearnSession = create<LearnState>((set) => ({
  selection: { theme: null, subcategories: [] },
  locked: false,
  setSelection: (s) => {
    set({ selection: s });
    // Marquer qu'on doit restaurer au prochain retour
    localStorage.setItem(RESTORE_KEY, "1");
  },
  lock: () => set({ locked: true }),
  reset: () => {
    set({ selection: { theme: null, subcategories: [] }, locked: false });
    localStorage.removeItem(RESTORE_KEY);
  },
  shouldRestore: () => {
    return localStorage.getItem(RESTORE_KEY) === "1";
  },
  markRestored: () => {
    localStorage.removeItem(RESTORE_KEY);
  },
}));

export default useLearnSession;
