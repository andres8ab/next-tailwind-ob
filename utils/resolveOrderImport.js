import { findProductByRef } from "@/utils/productRef";
import { clearsStockFlag } from "@/utils/cartStock";

/**
 * @typedef {'ok' | 'partial' | 'out_of_stock' | 'not_found'} ImportStatus
 */

/**
 * @param {Array<{ ref: string; qty: number }>} parsedLines
 * @param {Array<object>} products
 * @param {{ mode?: 'merge' | 'replace'; existingCartItems?: Array<{ _id: string; slug: string; quantity: number }> }} options
 */
export function resolveOrderImport(parsedLines, products, options = {}) {
  const mode = options.mode === "replace" ? "replace" : "merge";
  const existingCartItems = options.existingCartItems || [];

  const results = [];
  let addedCount = 0;

  for (const { ref, qty: requested } of parsedLines) {
    const product = findProductByRef(products, ref);

    if (!product) {
      results.push({
        ref,
        name: "",
        requested,
        quantity: 0,
        added: 0,
        available: 0,
        status: "not_found",
      });
      continue;
    }

    const stock = Number(product.countInStock) || 0;
    const existing =
      existingCartItems.find((item) => String(item._id) === String(product._id)) ||
      existingCartItems.find((item) => item.slug === product.slug);
    const existingQty = existing ? Number(existing.quantity) || 0 : 0;

    if (stock <= 0) {
      results.push({
        ref,
        name: product.name,
        productId: String(product._id),
        requested,
        quantity: 0,
        added: 0,
        available: 0,
        status: "out_of_stock",
      });
      continue;
    }

    const desiredTotal =
      mode === "replace" ? requested : existingQty + requested;
    const finalQty = Math.min(desiredTotal, stock);
    const added = Math.max(0, finalQty - existingQty);

    let status = "ok";
    if (finalQty < desiredTotal) {
      status = "partial";
    }

    if (finalQty > 0) {
      addedCount += 1;
    }

    results.push({
      ref,
      name: product.name,
      productId: String(product._id),
      requested,
      quantity: finalQty,
      added,
      available: stock,
      status,
      cartItem:
        finalQty > 0
          ? {
              _id: String(product._id),
              slug: product.slug,
              name: product.name,
              image: product.image,
              price: product.price,
              countInStock: stock,
              group: product.group,
              quantity: finalQty,
              clearsStock: clearsStockFlag(finalQty, stock),
            }
          : null,
    });
  }

  const summary = {
    addedCount,
    notFound: results.filter((r) => r.status === "not_found"),
    outOfStock: results.filter((r) => r.status === "out_of_stock"),
    partial: results.filter((r) => r.status === "partial"),
    ok: results.filter((r) => r.status === "ok"),
  };

  return { results, summary };
}
