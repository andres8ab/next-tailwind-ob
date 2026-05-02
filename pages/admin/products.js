import axios from "axios";
import Link from "next/link";
import React, { useEffect, useReducer, useState } from "react";
import Layout from "@/components/Layout";
import { getError } from "@/utils/error";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, products: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loadingCreate: true };
    case "CREATE_SUCCESS":
      return { ...state, loadingCreate: false };
    case "CREATE_FAIL":
      return { ...state, loadingCreate: false };
    case "DELETE_REQUEST":
      return { ...state, loadingDelete: true };
    case "DELETE_SUCCESS":
      return { ...state, loadingDelete: false, successDelete: true };
    case "DELETE_FAIL":
      return { ...state, loadingDelete: false };
    case "DELETE_RESET":
      return { ...state, loadingDelete: false, successDelete: false };
    default:
      state;
  }
}

export default function AdminProductsScreen() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [filterQuery, setFilterQuery] = useState("");

  const [
    { loading, error, products, loadingCreate, successDelete, loadingDelete },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    products: [],
    error: "",
  });

  const q = filterQuery.trim().toLowerCase();
  const filteredProducts =
    q.length === 0
      ? products
      : products.filter((p) => {
          const name = (p.name || "").toLowerCase();
          const category = (p.category || "").toLowerCase();
          const id = String(p._id || "").toLowerCase();
          const price = String(p.price ?? "");
          return (
            name.includes(q) ||
            category.includes(q) ||
            id.includes(q) ||
            price.includes(q)
          );
        });

  const sortedProducts = [...filteredProducts].sort(function (a, b) {
    const comparison = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    });
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const createHandler = async () => {
    if (!window.confirm("Estas seguro?")) {
      return;
    }
    try {
      dispatch({ type: "CREATE_REQUEST" });
      const { data } = await axios.post(`/api/admin/products`);
      dispatch({ type: "CREATE_SUCCESS" });
      toast.success("Producto creado correctamente");
      router.push(`/admin/product/${data.product._id}`);
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/admin/products`);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [successDelete]);

  const deleteHandler = async (productId) => {
    if (!window.confirm("Estas seguro de eliminar?")) {
      return;
    }
    try {
      dispatch({ type: "DELETE_REQUEST" });
      await axios.delete(`/api/admin/products/${productId}`);
      dispatch({ type: "DELETE_SUCCESS" });
      toast.success("Producto eliminado");
    } catch (err) {
      dispatch({ type: "DELETE_FAIL" });
      toast.error(getError(err));
    }
  };
  return (
    <Layout title="Admin Productos">
      <div className="grid md:grid-cols-4 md:gap-5">
        <div>
          <ul>
            <li>
              <Link href="/admin/dashboard">Admin Panel</Link>
            </li>
            <li>
              <Link href="/admin/orders">Ordenes</Link>
            </li>
            <li>
              <Link href="/admin/products" className="font-bold">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/admin/users">Usuarios</Link>
            </li>
          </ul>
        </div>
        <div className="overflow-x-auto md:col-span-3">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-xl flex-1">
              <h1 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Productos
              </h1>
              <label htmlFor="admin-product-filter" className="sr-only">
                Filtrar productos
              </label>
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="admin-product-filter"
                  type="search"
                  autoComplete="off"
                  placeholder="Buscar por nombre, categoría, precio o ID…"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full border-gray-200 py-2.5 pl-10 pr-10 shadow-sm dark:border-gray-600"
                />
                {filterQuery ? (
                  <button
                    type="button"
                    onClick={() => setFilterQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 self-start">
              {loadingDelete && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Eliminando item...
                </span>
              )}
              <button
                disabled={loadingCreate}
                onClick={createHandler}
                className="primary-button"
              >
                {loadingCreate ? "Cargando" : "Crear"}
              </button>
            </div>
          </div>
          {loading ? (
            <div>Cargando...</div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : (
            <div className="overflow-x-auto md:col-span-3">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="px-5 text-left">ID</th>
                    <th className="p-5 text-left">
                      <button
                        onClick={toggleSortOrder}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        type="button"
                      >
                        NOMBRE
                        {sortOrder === "asc" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>
                    </th>
                    <th className="p-5 text-left">PRECIO</th>
                    <th className="p-5 text-left">CATEGORIA</th>
                    <th className="p-5 text-left">CANTIDAD</th>
                    <th className="p-5 text-left">ACCION</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="p-5">{product._id.substring(20, 24)}</td>
                      <td className="p-5">{product.name}</td>
                      <td className="p-5">${product.price}</td>
                      <td className="p-5">{product.category}</td>
                      <td className="p-5">{product.countInStock}</td>
                      <td className="p-5">
                        <Link href={`/admin/product/${product._id}`}>
                          Editar
                        </Link>
                        &nbsp;
                        <button
                          onClick={() => deleteHandler(product._id)}
                          className="default-button"
                          type="button"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

AdminProductsScreen.auth = { adminOnly: true };
