import { create } from "zustand";

export type ReviewSelection = {
  theme: string | null;
  subcategories: string[]; // tokens "category::sub"
};

type ReviewState = {
  selection: ReviewSelection;
  locked: boolean;
  setSelection: (s: ReviewSelection) => void;
  lock: () => void;
  reset: () => void;
  shouldRestore: () => boolean;
  markRestored: () => void;
};

const RESTORE_KEY = "qcm_restore_flag";

export const useReviewSession = create<ReviewState>((set) => ({
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

export default useReviewSession;
