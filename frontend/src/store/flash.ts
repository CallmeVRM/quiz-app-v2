import { create } from "zustand";

type FlashState = {
  marks: Record<string, true>;          // key: "${cat}::${sub}::${flashId}"
  toggleMark: (key: string) => void;
  clear: () => void;
};

const useFlash = create<FlashState>((set, get) => ({
  marks: {},
  toggleMark: (key) => {
    const cur = get().marks;
    const next = { ...cur };
    if (next[key]) delete next[key];
    else next[key] = true;
    set({ marks: next });
  },
  clear: () => set({ marks: {} }),
}));

export default useFlash;
