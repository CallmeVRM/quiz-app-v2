import React from "react";

interface ActionBarProps {
  children: React.ReactNode;
  sticky?: boolean;
}

export function ActionBar({ children, sticky = true }: ActionBarProps) {
  return (
    <div
      style={{
        position: sticky ? "sticky" : "relative",
        bottom: 0,
        left: 0,
        right: 0,
        marginTop: "auto",
        padding: "1rem 0",
        background: "linear-gradient(to top, var(--bg) 0%, var(--bg) 60%, transparent 100%)",
        display: "flex",
        justifyContent: "flex-end",
        gap: "0.75rem",
        flexWrap: "wrap",
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  icon?: React.ReactNode;
  loading?: boolean;
}

export function ActionButton({
  children,
  variant = "secondary",
  icon,
  loading = false,
  ...props
}: ActionButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    borderRadius: "10px",
    border: "1px solid",
    cursor: loading ? "wait" : "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    minWidth: "fit-content",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "#fff",
      borderColor: "var(--accent)",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    secondary: {
      background: "var(--bg-elev)",
      color: "var(--text)",
      borderColor: "var(--border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text)",
      borderColor: "transparent",
    },
  };

  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...props.style,
        opacity: loading || props.disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading && !props.disabled) {
          const target = e.currentTarget;
          if (variant === "primary") {
            target.style.background = "var(--accent-600)";
            target.style.transform = "translateY(-1px)";
            target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
          } else if (variant === "secondary") {
            target.style.background = "var(--bg)";
            target.style.borderColor = "var(--accent)";
          } else {
            target.style.background = "var(--bg)";
          }
        }
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget;
        target.style.transform = "translateY(0)";
        if (variant === "primary") {
          target.style.background = "var(--accent)";
          target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        } else if (variant === "secondary") {
          target.style.background = "var(--bg-elev)";
          target.style.borderColor = "var(--border)";
        } else {
          target.style.background = "transparent";
        }
      }}
    >
      {loading ? (
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      ) : icon ? (
        <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

// Add keyframes for loading spinner
if (typeof document !== "undefined") {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Ignore if already exists
  }
}
