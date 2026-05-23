const ORDER_HEADER = "PEDIDO OB";

/**
 * @param {Array<{ ref: string; qty: number }>} lines
 * @returns {string}
 */
export function formatOrderMessage(lines) {
  const items = lines.filter((line) => line.qty > 0);
  if (items.length === 0) return ORDER_HEADER;

  const body = items
    .map(({ ref, qty }) => `${ref.toUpperCase()} x${qty}`)
    .join("\n");

  return `${ORDER_HEADER}\n${body}`;
}

/**
 * @param {Record<string, number | string>} quantitiesByRef
 * @returns {string}
 */
export function formatOrderMessageFromMap(quantitiesByRef) {
  const lines = Object.entries(quantitiesByRef)
    .map(([ref, qty]) => ({
      ref: ref.toUpperCase(),
      qty: Number(qty),
    }))
    .filter((line) => Number.isFinite(line.qty) && line.qty > 0)
    .sort((a, b) => a.ref.localeCompare(b.ref, "es"));

  return formatOrderMessage(lines);
}
