import { create } from "zustand";

export type Toast = { id: number; type: "info" | "success" | "error"; message: string; ttl?: number };

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: number) => void;
  clear: () => void;
};

let SEQ = 1;

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = SEQ++;
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    const ttl = t.ttl ?? 5000;
    if (ttl > 0) setTimeout(() => get().remove(id), ttl);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export const notify = {
  info: (msg: string, ttl?: number) => useToast.getState().push({ type: "info", message: msg, ttl }),
  success: (msg: string, ttl?: number) => useToast.getState().push({ type: "success", message: msg, ttl }),
  error: (msg: string, ttl?: number) => useToast.getState().push({ type: "error", message: msg, ttl }),
};
