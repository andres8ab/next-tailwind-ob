import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Fragment, useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatOrderMessageFromMap } from "@/utils/formatOrderMessage";
import { getProductRef } from "@/utils/productRef";
import { Store } from "@/utils/Store";
import { getError } from "@/utils/error";
import { showImportToasts } from "@/utils/importOrderToasts";
import {
  formatCatalogPrice,
  splitCatalogName,
} from "@/utils/catalogFormat";

export default function CatalogPedidoScreen({ products }) {
  const router = useRouter();
  const { status } = useSession();
  const { state, dispatch } = useContext(Store);
  const { cartItems } = state.cart;
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const availableProducts = useMemo(
    () =>
      products
        .filter((p) => p.countInStock > 0)
        .sort((a, b) => {
          const c = a.category.localeCompare(b.category, "es");
          if (c !== 0) return c;
          return a.name.localeCompare(b.name, "es");
        }),
    [products],
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

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;

  const setQty = (ref, value) => {
    const qty = Math.max(0, Number.parseInt(value, 10) || 0);
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[ref];
      else next[ref] = qty;
      return next;
    });
  };

  const addToCartHandler = async () => {
    if (selectedCount < 1) {
      return toast.error("Ingresá al menos una cantidad");
    }

    // La sesión todavía se está resolviendo: no mandamos a login a un usuario
    // que sí está logueado.
    if (status === "loading") return;

    if (status !== "authenticated") {
      toast.info("Iniciá sesión para agregar el pedido al carrito");
      return router.push("/login?redirect=/catalogo-pedido");
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/cart/import-order", {
        text: formatOrderMessageFromMap(quantities),
        mode: "merge",
        existingCartItems: cartItems.map((item) => ({
          _id: item._id,
          slug: item.slug,
          quantity: item.quantity,
        })),
      });

      if (data.cartItems.length > 0) {
        dispatch({
          type: "CART_IMPORT_ITEMS",
          payload: { items: data.cartItems },
        });
      }

      showImportToasts(data.summary);

      if (data.summary.addedCount > 0) {
        setAddedCount(data.summary.addedCount);
        setQuantities({});
      }
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
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
        <strong>Pedido rápido.</strong> Completá <strong>Cant.</strong> en los
        productos que quieras y tocá{" "}
        <strong>Agregar al carrito</strong>.
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
        {addedCount > 0 ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100">
            <span className="flex-1">
              {addedCount} producto{addedCount === 1 ? "" : "s"} agregado
              {addedCount === 1 ? "" : "s"} al carrito.{" "}
              <Link
                href="/cart"
                className="font-semibold text-green-900 underline hover:text-green-700 dark:text-green-100 dark:hover:text-white"
              >
                Ver carrito
              </Link>
            </span>
            <button
              type="button"
              onClick={() => setAddedCount(0)}
              aria-label="Cerrar aviso"
              title="Cerrar"
              className="shrink-0 rounded-md p-1 text-green-800 transition-colors hover:bg-green-100 dark:text-green-200 dark:hover:bg-green-900/60"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={addToCartHandler}
          disabled={loading || status === "loading"}
          aria-busy={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#128c7e] py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCartIcon className="h-5 w-5 shrink-0" aria-hidden />
          {loading
            ? "Agregando…"
            : `Agregar al carrito${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
        </button>
      </div>
    </div>
  );
}
