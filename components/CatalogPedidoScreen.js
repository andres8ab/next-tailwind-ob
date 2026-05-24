import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { formatOrderMessageFromMap } from "@/utils/formatOrderMessage";
import { getProductRef } from "@/utils/productRef";
import {
  formatCatalogPrice,
  splitCatalogName,
} from "@/utils/catalogFormat";

export default function CatalogPedidoScreen({ products, initialScope = "todos" }) {
  const [scope] = useState(initialScope === "ob" ? "ob" : "todos");
  const [quantities, setQuantities] = useState({});
  const [orderPreview, setOrderPreview] = useState("");

  const availableProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.countInStock > 0 && (scope === "ob" ? p.group === "ob" : true),
        )
        .sort((a, b) => {
          const c = a.category.localeCompare(b.category, "es");
          if (c !== 0) return c;
          return a.name.localeCompare(b.name, "es");
        }),
    [products, scope],
  );

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of availableProducts) {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    }
    return [...map.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], "es"),
    );
  }, [availableProducts]);

  const buildOrderText = () => formatOrderMessageFromMap(quantities);

  const setQty = (ref, value) => {
    const qty = Math.max(0, Number.parseInt(value, 10) || 0);
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[ref];
      else next[ref] = qty;
      return next;
    });
  };

  const validateOrder = () => {
    const text = buildOrderText();
    const lineCount = Object.values(quantities).filter((q) => q > 0).length;
    if (lineCount < 1) {
      toast.error("Ingresá al menos una cantidad");
      return null;
    }
    return text;
  };

  const showOrderPreview = (text) => {
    setOrderPreview(text);
  };

  const copyOrder = async () => {
    const text = validateOrder();
    if (!text) return;
    showOrderPreview(text);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Pedido copiado. Pegalo en WhatsApp.");
    } catch {
      toast.info("Seleccioná el texto de abajo y copiá.", { autoClose: 8000 });
    }
  };

  const shareOrder = async () => {
    const text = validateOrder();
    if (!text) return;
    showOrderPreview(text);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Pedido OB", text });
        toast.success("Pedido listo para enviar.");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    await copyOrder();
  };

  if (availableProducts.length === 0) {
    return (
      <p className="py-8 text-center text-gray-600 dark:text-gray-300">
        No hay productos en stock para este catálogo.
      </p>
    );
  }

  return (
    <div className="pb-44">
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Catálogo para pedidos.</strong> Completá <strong>Cant.</strong>,
        tocá <strong>Copiar pedido</strong> y enviá el texto por WhatsApp.
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
        <table className="w-full table-fixed border-collapse bg-white text-sm dark:bg-gray-900">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[26%]" />
            <col className="w-[22%]" />
            <col className="w-[19%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border border-gray-300 p-2 dark:border-gray-600">
                Ref.
              </th>
              <th className="border border-gray-300 p-2 dark:border-gray-600">
                Descripción
              </th>
              <th className="border border-gray-300 p-2 dark:border-gray-600">
                Imagen
              </th>
              <th className="border border-gray-300 p-2 dark:border-gray-600">
                Precio
              </th>
              <th className="border border-gray-300 p-2 dark:border-gray-600">
                Cant.
              </th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map(([category, items]) => (
              <Fragment key={category}>
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-300 bg-gray-900 p-2 text-center text-xs font-bold uppercase text-white dark:border-gray-600"
                  >
                    {category}
                  </td>
                </tr>
                {items.map((product) => {
                  const ref = getProductRef(product.name);
                  const { description } = splitCatalogName(product.name);
                  return (
                    <tr key={product._id}>
                      <td className="border border-gray-300 p-2 text-center text-xs font-bold leading-tight dark:border-gray-600">
                        {ref}
                      </td>
                      <td className="border border-gray-300 p-2 text-left text-xs leading-tight dark:border-gray-600">
                        {description}
                      </td>
                      <td className="border border-gray-300 p-2 dark:border-gray-600">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={48}
                          className="mx-auto h-12 w-auto object-contain"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-xs font-semibold dark:border-gray-600">
                        {formatCatalogPrice(product.price)}
                      </td>
                      <td className="border border-gray-300 p-2 text-center dark:border-gray-600">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          placeholder="0"
                          value={quantities[ref] ?? ""}
                          onChange={(e) => setQty(ref, e.target.value)}
                          className="w-full max-w-[3.25rem] rounded border border-gray-300 bg-white px-1 py-2 text-center text-base dark:border-gray-600 dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={shareOrder}
          className="mb-2 w-full rounded-xl bg-[#128c7e] py-3.5 text-base font-bold text-white"
        >
          Compartir pedido en WhatsApp
        </button>
        <button
          type="button"
          onClick={copyOrder}
          className="w-full rounded-xl bg-gray-900 py-3.5 text-base font-bold text-white dark:bg-gray-100 dark:text-gray-900"
        >
          Copiar pedido para WhatsApp
        </button>
        {orderPreview ? (
          <div className="mt-3">
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
              Texto del pedido:
            </p>
            <textarea
              readOnly
              value={orderPreview}
              rows={5}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
