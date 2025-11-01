import { useState } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  badge?: string;
  group?: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  maxHeight?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  label,
  maxHeight = "400px",
}: MultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: "var(--text)",
          }}
        >
          {label}
        </label>
      )}

      {/* Header avec recherche et actions */}
      <div
        style={{
          background: "var(--bg-elev)",
          border: "2px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Search */}
        <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border)" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Rechercher..."
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem",
              border: "2px solid var(--border)",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              outline: "none",
              background: "var(--bg)",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border)";
            }}
          />
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "0.625rem 0.875rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg)",
          }}
        >
          <button
            type="button"
            onClick={toggleAll}
            style={{
              fontSize: "0.813rem",
              padding: "0.375rem 0.75rem",
              fontWeight: 600,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            {selected.length === options.length ? "❌ Tout désélectionner" : "✅ Tout sélectionner"}
          </button>
          <span style={{ fontSize: "0.813rem", color: "var(--muted)", fontWeight: 500 }}>
            <strong style={{ color: "var(--accent)" }}>{selected.length}</strong> / {options.length}
          </span>
        </div>

        {/* Options list - TOUJOURS VISIBLE */}
        <div style={{ maxHeight, overflowY: "auto", padding: "0.5rem" }}>
          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "0.875rem",
              }}
            >
              Aucun résultat pour "{searchTerm}"
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => !option.disabled && toggleOption(option.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    marginBottom: "0.375rem",
                    cursor: option.disabled ? "not-allowed" : "pointer",
                    backgroundColor: isSelected ? "var(--accent)" : "var(--bg-elev)",
                    color: isSelected ? "#fff" : "var(--text)",
                    border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "10px",
                    transition: "all 0.2s",
                    opacity: option.disabled ? 0.5 : 1,
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "1rem",
                  }}
                  onMouseEnter={(e) => {
                    if (!option.disabled) {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                    if (!isSelected) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: 1 }}>
                    {/* Checkbox visuel */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        border: `2px solid ${isSelected ? "#fff" : "var(--border)"}`,
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isSelected ? "rgba(255,255,255,0.2)" : "transparent",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <span style={{ fontSize: "0.875rem" }}>✓</span>}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      {option.group && (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: isSelected ? "rgba(255,255,255,0.7)" : "var(--muted)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            marginBottom: "0.125rem",
                          }}
                        >
                          {option.group}
                        </div>
                      )}
                      <div>{option.label}</div>
                    </div>
                  </div>
                  
                  {option.badge && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "6px",
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.25)"
                          : "var(--accent-50)",
                        color: isSelected ? "#fff" : "var(--accent)",
                        fontWeight: 700,
                        marginLeft: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {option.badge}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
