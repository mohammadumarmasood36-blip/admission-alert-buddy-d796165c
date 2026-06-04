// HTML-escape any user/DB-sourced string before interpolating into
// template-string HTML used by document.write() in print popups.
// Prevents stored XSS via injected names, IDs, etc.
export function escapeHtml(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export const esc = escapeHtml;
