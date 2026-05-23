const HEADER_RE = /^PEDIDO\s+OB\b/i;

const LINE_PATTERNS = [
  /^([A-Za-z0-9][A-Za-z0-9-]*)\s*[x×:]\s*(\d+)\s*$/i,
  /^([A-Za-z0-9][A-Za-z0-9-]*)\s+(\d+)\s*$/,
];

/**
 * @param {string} text
 * @returns {Array<{ ref: string; qty: number }>}
 */
export function parseOrderMessage(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  /** @type {Map<string, number>} */
  const byRef = new Map();

  for (const line of lines) {
    if (HEADER_RE.test(line)) continue;

    let parsed = null;
    for (const pattern of LINE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        parsed = {
          ref: match[1].toUpperCase(),
          qty: Number.parseInt(match[2], 10),
        };
        break;
      }
    }

    if (!parsed || !Number.isFinite(parsed.qty) || parsed.qty <= 0) continue;

    byRef.set(parsed.ref, (byRef.get(parsed.ref) || 0) + parsed.qty);
  }

  return [...byRef.entries()].map(([ref, qty]) => ({ ref, qty }));
}
