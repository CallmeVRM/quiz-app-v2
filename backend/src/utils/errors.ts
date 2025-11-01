/** Structure d'erreur uniforme côté API */
export function makeErrorReply(code: string, message: string, details?: unknown) {
  return { error: { code, message, details } };
}

/** Transforme des issues Zod en message lisible (compact) */
export function summarizeZodIssues(issues: readonly any[], max = 5): string {
  const lines = issues.slice(0, max).map((i) => {
    const path = Array.isArray(i.path) && i.path.length ? i.path.join(".") : "(root)";
    return `${path}: ${i.message}`;
  });
  const extra = issues.length > max ? ` …and ${issues.length - max} more` : "";
  return lines.join("; ") + extra;
}
