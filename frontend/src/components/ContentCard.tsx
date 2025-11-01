import React from "react";

interface ContentCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
  elevated?: boolean;
  progress?: number;
}

export default function ContentCard({
  children,
  title,
  subtitle,
  className = "",
  style,
  noPadding = false,
  elevated = false,
  progress,
}: ContentCardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        boxShadow: elevated ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
        overflow: "hidden",
        transition: "all 0.2s",
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          {title && (
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              style={{
                margin: title ? "0.375rem 0 0" : 0,
                fontSize: "0.875rem",
                color: "var(--muted)",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
          {typeof progress === "number" && (
            <div style={{ marginTop: "0.75rem" }}>
              <ProgressIndicator percentage={progress} />
            </div>
          )}
        </div>
      )}
      {children && <div style={{ padding: noPadding ? 0 : "1.5rem" }}>{children}</div>}
    </div>
  );
}

interface ProgressIndicatorProps {
  current?: number;
  total?: number;
  percentage?: number;
  color?: string;
  hideLabels?: boolean;
}

export function ProgressIndicator({ 
  current, 
  total, 
  percentage: providedPercentage, 
  color = "var(--accent)",
  hideLabels = false 
}: ProgressIndicatorProps) {
  const percentage = providedPercentage ?? (current && total ? Math.round((current / total) * 100) : 0);

  return (
    <div>
      {!hideLabels && current && total && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
            Question {current} sur {total}
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{percentage}%</span>
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: "8px",
          background: "var(--bg)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: "999px",
          }}
        />
      </div>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}

export function StatBadge({ label, value, color = "var(--accent)", icon }: StatBadgeProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: "999px",
        fontSize: "0.875rem",
        fontWeight: 600,
      }}
    >
      {icon && <span style={{ display: "flex", color }}>{icon}</span>}
      <span style={{ color: "var(--muted)" }}>{label}:</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}
