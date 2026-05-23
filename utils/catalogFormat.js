/**
 * @param {number} price
 * @returns {string}
 */
export function formatCatalogPrice(price) {
  return "$ " + Number(price).toLocaleString("es-AR");
}

/**
 * @param {string} rawName
 * @returns {{ ref: string; description: string }}
 */
export function splitCatalogName(rawName) {
  const s = String(rawName).trim();
  const i = s.search(/\s/);
  if (i === -1) {
    return { ref: s.toUpperCase(), description: "" };
  }
  return {
    ref: s.slice(0, i).toUpperCase(),
    description: s
      .slice(i + 1)
      .trim()
      .toUpperCase(),
  };
}

/** @param {string} value */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
