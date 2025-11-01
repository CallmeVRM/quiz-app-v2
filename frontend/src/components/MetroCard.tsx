import React from "react";

interface MetroCardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  lineColor: string;
  onClick?: () => void;
  selected?: boolean;
  stats?: Array<{ label: string; value: string | number }>;
}

export default function MetroCard({
  title,
  description,
  children,
  lineColor,
  onClick,
  selected = false,
  stats,
}: MetroCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `4px solid ${lineColor}`,
        borderRadius: 0,
        padding: 20,
        backgroundColor: selected ? `${lineColor}15` : "#FFFFFF",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        boxShadow: selected ? `0 4px 12px ${lineColor}40` : "0 2px 8px rgba(0,0,0,0.1)",
        borderLeftWidth: onClick ? "6px" : "4px",
      }}
      onMouseEnter={(e) => {
        if (onClick && !selected) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = selected
            ? `0 4px 12px ${lineColor}40`
            : "0 2px 8px rgba(0,0,0,0.1)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }
      }}
    >
      {title && (
        <div
          style={{
            fontSize: "1.1em",
            fontWeight: 900,
            color: lineColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 8,
          }}
        >
          {title}
        </div>
      )}

      {description && (
        <div
          style={{
            fontSize: "0.9em",
            color: "#666666",
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}

      {stats && stats.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            gap: 12,
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${lineColor}30`,
          }}
        >
          {stats.map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: "0.8em", color: "#999999", textTransform: "uppercase", marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "1.4em", fontWeight: 700, color: lineColor }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}
