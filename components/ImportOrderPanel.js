import axios from "axios";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Store } from "@/utils/Store";
import { getError } from "@/utils/error";

const STATUS_LABELS = {
  ok: "OK",
  partial: "Cantidad ajustada",
  out_of_stock: "Agotado",
  not_found: "No encontrado",
};

function showImportToasts(summary) {
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
    toast.error(
      `Agotados: ${outOfStock.map((item) => item.ref).join(", ")}`,
      { autoClose: 7000 }
    );
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

export default function ImportOrderPanel() {
  const { state, dispatch } = useContext(Store);
  const { cartItems } = state.cart;
  const [text, setText] = useState("");
  const [mode, setMode] = useState("merge");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runImport = async (previewOnly) => {
    if (!text.trim()) {
      return toast.error("Pegá el mensaje de WhatsApp con el pedido");
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/cart/import-order", {
        text,
        mode,
        existingCartItems: cartItems.map((item) => ({
          _id: item._id,
          slug: item.slug,
          quantity: item.quantity,
        })),
      });

      if (previewOnly) {
        setPreview(data);
        return;
      }

      if (data.cartItems.length === 0) {
        showImportToasts(data.summary);
        setPreview(data);
        return;
      }

      dispatch({
        type: "CART_IMPORT_ITEMS",
        payload: { items: data.cartItems },
      });
      showImportToasts(data.summary);
      setPreview(data);
      setText("");
    } catch (err) {
      toast.error(getError(err));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          Importar pedido de WhatsApp
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {expanded ? "Ocultar" : "Mostrar"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pegá el mensaje del cliente (formato:{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-800">
              AL-005 x2
            </code>
            ).
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null);
            }}
            rows={5}
            placeholder={`PEDIDO OB\nAL-005 x2\nAR-027 x1`}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none ring-red-300 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="import-mode"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
              />
              Sumar al carrito
            </label>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="import-mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              Reemplazar líneas importadas
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => runImport(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-white disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Vista previa
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => runImport(false)}
              className="primary-button px-4 py-2 text-sm disabled:opacity-60"
            >
              {loading ? "Procesando…" : "Agregar al carrito"}
            </button>
          </div>

          {preview?.results?.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-2 text-left">Ref.</th>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Pedido</th>
                    <th className="px-3 py-2 text-right">Agregar</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.results.map((row) => (
                    <tr
                      key={row.ref}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-3 py-2 font-medium">{row.ref}</td>
                      <td className="px-3 py-2">{row.name || "—"}</td>
                      <td className="px-3 py-2 text-right">{row.requested}</td>
                      <td className="px-3 py-2 text-right">
                        {row.quantity || 0}
                      </td>
                      <td className="px-3 py-2">
                        {STATUS_LABELS[row.status] || row.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
