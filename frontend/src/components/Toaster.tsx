import { useToast } from "../store/toast";

export default function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const remove = useToast((s) => s.remove);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        display: "grid",
        gap: 8,
        zIndex: 1000,
        maxWidth: 420,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            border: "1px solid var(--border)",
            background:
              t.type === "error"
                ? "#fff0f0"
                : t.type === "success"
                ? "#f0fff5"
                : "var(--bg-elev)",
            color: "var(--text)",
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              marginTop: 6,
              background:
                t.type === "error" ? "#c62828" : t.type === "success" ? "#118d57" : "var(--accent)",
            }}
          />
          <div style={{ flex: 1 }}>{t.message}</div>
          <button
            onClick={() => remove(t.id)}
            className="btn-ghost"
            aria-label="Fermer la notification"
            style={{ padding: "4px 8px" }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
