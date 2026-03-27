/** True when this line buys every remaining unit (will leave countInStock at 0 after fulfillment). */
export function clearsStockFlag(quantity, countInStock) {
  const q = Number(quantity);
  const s = Number(countInStock);
  return s > 0 && q === s;
}
