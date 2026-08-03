import { toast } from "react-toastify";

export const STATUS_LABELS = {
  ok: "OK",
  partial: "Cantidad ajustada",
  out_of_stock: "Agotado",
  not_found: "No encontrado",
};

export function showImportToasts(summary) {
  const { addedCount, notFound, outOfStock, partial } = summary;

  if (addedCount > 0) {
    toast.success(
      `${addedCount} producto${addedCount === 1 ? "" : "s"} agregado${addedCount === 1 ? "" : "s"} al carrito`
    );
  }

  if (partial.length > 0) {
    const lines = partial
      .map(
        (item) =>
          `${item.ref}: pediste ${item.requested}, hay ${item.available} — agregamos ${item.quantity}`
      )
      .join("\n");
    toast.warn(lines, { autoClose: 8000 });
  }

  if (outOfStock.length > 0) {
    toast.error(`Agotados: ${outOfStock.map((item) => item.ref).join(", ")}`, {
      autoClose: 7000,
    });
  }

  if (notFound.length > 0) {
    toast.warn(
      `Referencias no encontradas: ${notFound.map((item) => item.ref).join(", ")}`,
      { autoClose: 7000 }
    );
  }

  if (addedCount === 0 && partial.length === 0 && outOfStock.length === 0) {
    toast.info("No se agregó ningún producto al carrito");
  }
}
