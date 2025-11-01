import React from "react";

interface MetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  lineColor?: string;
  loading?: boolean;
}

export default function MetroButton({
  variant = "primary",
  size = "md",
  lineColor,
  loading = false,
  children,
  ...props
}: MetroButtonProps) {
  const sizeStyles = {
    sm: { padding: "6px 12px", fontSize: "0.8em" },
    md: { padding: "10px 20px", fontSize: "0.9em" },
    lg: { padding: "12px 28px", fontSize: "1em" },
  };

  const variantStyles = {
    primary: {
      backgroundColor: lineColor || "#EE352E",
      color: "#FFFFFF",
      border: `2px solid ${lineColor || "#EE352E"}`,
    },
    secondary: {
      backgroundColor: "transparent",
      color: lineColor || "#0039A6",
      border: `2px solid ${lineColor || "#0039A6"}`,
    },
    danger: {
      backgroundColor: "#EE352E",
      color: "#FFFFFF",
      border: "2px solid #EE352E",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "#666666",
      border: "2px solid #CCCCCC",
    },
  };

  return (
    <button
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderRadius: 0,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s",
        fontFamily: "inherit",
      }}
      disabled={loading}
      onMouseEnter={(e) => {
        if (!loading && !props.disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
