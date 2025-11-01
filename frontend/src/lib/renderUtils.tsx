// src/lib/renderUtils.ts
import React from "react";

/**
 * Retourne un ReactNode sûr pour toute valeur passée.
 * - string/number/boolean -> chaîne
 * - array -> map des éléments
 * - object -> si {title,code} on affiche title + pre(code), sinon JSON pretty-print
 */
export function safeRender(value: any): React.ReactNode {
  if (value === null || value === undefined) return null;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((v, i) => (
      <React.Fragment key={i}>
        {safeRender(v)}
        {i < value.length - 1 ? <br /> : null}
      </React.Fragment>
    ));
  }

  if (typeof value === "object") {
    // Cas classique { title, code } ou { title, cmd }
    const title = (value.title ?? value.name) || null;
    const code = value.code ?? value.cmd ?? value.command ?? null;

    if (title || code) {
      return (
        <div>
          {title ? <div style={{ fontWeight: 600, marginBottom: 6 }}>{String(title)}</div> : null}
          {code ? (
            <pre style={{
              background: "#f8f8f8",
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 8,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {String(code)}
            </pre>
          ) : null}
          {/* affiche tout le reste (s'il y en a) */}
          {Object.keys(value).length > (title ? 1 : 0) + (code ? 1 : 0) ? (
            <pre style={{ color: "#666", fontSize: 12, marginTop: 6 }}>{JSON.stringify(value, null, 2)}</pre>
          ) : null}
        </div>
      );
    }

    // fallback : stringify
    return <pre style={{ color: "#666", fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>;
  }

  // fallback
  return String(value);
}

/** Rend un bloc de code sûr (string ou array/object) */
export function renderCodeLike(value: any): React.ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return (
      <pre style={{
        background: "#f8f8f8",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 8,
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }}>
        {String(value)}
      </pre>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {value.map((v, i) => <div key={i}>{renderCodeLike(v)}</div>)}
      </div>
    );
  }
  if (typeof value === "object") {
    const code = value.code ?? value.cmd ?? value.command ?? null;
    if (code) {
      return (
        <pre style={{
          background: "#f8f8f8",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 8,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {String(code)}
        </pre>
      );
    }
    // fallback: pretty object
    return <pre style={{ color: "#666", fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
}