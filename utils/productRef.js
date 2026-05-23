/**
 * Product ref is the first token of `name` (e.g. "AL-005 Alternador NPR" → "AL-005").
 * @param {string} name
 * @returns {string}
 */
export function getProductRef(name) {
  const s = String(name).trim();
  const i = s.search(/\s/);
  if (i === -1) return s.toUpperCase();
  return s.slice(0, i).toUpperCase();
}

/**
 * @param {Array<{ name: string }>} products
 * @param {string} ref
 * @returns {object | undefined}
 */
export function findProductByRef(products, ref) {
  const key = String(ref).trim().toUpperCase();
  if (!key) return undefined;
  return products.find((p) => getProductRef(p.name) === key);
}
