import { useEffect, useRef, useState } from "react";

export type CheckItem = {
  value: string;
  label: string;
  hint?: string;     // ex: "6 Q / 4 F"
};

type Props = {
  label: string;            // Titre du bouton ("Catégories", "Sous-catégories")
  items: CheckItem[];       // Liste des cases à cocher
  selected: string[];       // Valeurs sélectionnées
  onChange: (vals: string[]) => void;
  align?: "left" | "right"; // Alignement du panneau
};

export default function DropdownChecklist({ label, items, selected, onChange, align="left" }: Props) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur / ESC
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const allSelected = selected.length === items.length && items.length > 0;

  function toggle(v: string) {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v));
    else onChange([...selected, v]);
  }
  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(items.map(i => i.value));
  }

  return (
    <div ref={boxRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          border: "1px solid #e5e5e5", borderRadius: 10, padding: "8px 12px",
          background: "#fff", cursor: "pointer", minWidth: 260
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>{" "}
        <span style={{ color: "#666", fontSize: 12 }}>({selected.length}/{items.length})</span>
        <span style={{ float: "right", color: "#999" }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", zIndex: 50, top: "calc(100% + 6px)",
            [align === "left" ? "left" : "right"]: 0,
            width: 380, maxHeight: 360, overflow: "auto",
            background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)", padding: 10
          } as React.CSSProperties}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{selected.length} sélectionné(s)</div>
            <button
              type="button"
              onClick={toggleAll}
              style={{ fontSize: 12, border: "1px solid #ddd", borderRadius: 8, padding: "4px 8px", background: "#fafafa" }}
            >
              {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {items.map(it => (
              <label key={it.value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={selected.includes(it.value)} onChange={() => toggle(it.value)} />
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span>{it.label}</span>
                  {it.hint && <span style={{ color: "#777", fontSize: 12 }}>{it.hint}</span>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
