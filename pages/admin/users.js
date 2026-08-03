import { useRouter } from "next/router";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
const { default: axios } = require("axios");
const { default: Link } = require("next/link");
const { useReducer, useEffect, useState } = require("react");
const { toast } = require("react-toastify");
const { default: Layout } = require("@/components/Layout");
const { getError } = require("@/utils/error");

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, users: action.payload, error: "" };
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
      return state;
  }
}

function AdminUsersScreen() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [filterQuery, setFilterQuery] = useState("");
  const [
    { loading, error, users, successDelete, loadingCreate, loadingDelete },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    users: [],
    error: "",
  });

  const q = filterQuery.trim().toLowerCase();
  const filteredUsers =
    q.length === 0
      ? users
      : users.filter((u) => {
          const name = (u.name || "").toLowerCase();
          const username = (u.username || "").toLowerCase();
          const seller = String(u.seller ?? "").toLowerCase();
          const id = String(u._id || "").toLowerCase();
          return (
            name.includes(q) ||
            username.includes(q) ||
            seller.includes(q) ||
            id.includes(q)
          );
        });

  const sortedUsers = [...filteredUsers].sort(function (a, b) {
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
      const { data } = await axios.post(`/api/admin/users`);
      dispatch({ type: "CREATE_SUCCESS" });
      toast.success("Usuario creado correctamente");
      router.push(`/admin/user/${data.user._id}`);
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/admin/users`);
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

  const deleteHandler = async (userId) => {
    if (!window.confirm("Esta seguro de eliminar?")) {
      return;
    }
    try {
      dispatch({ type: "DELETE_REQUEST" });
      await axios.delete(`/api/admin/users/${userId}`);
      dispatch({ type: "DELETE_SUCCESS" });
      toast.success("Usuario eliminado correctamente");
    } catch (err) {
      dispatch({ type: "DELETE_FAIL" });
      toast.error(getError(err));
    }
  };

  return (
    <Layout title="Usuarios">
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
              <Link href="/admin/products">Productos</Link>
            </li>
            <li>
              <Link href="/admin/users" className="font-bold">
                Usuarios
              </Link>
            </li>
          </ul>
        </div>
        <div className="overflow-x-auto md:col-span-3">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-xl flex-1">
              <h1 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Usuarios
              </h1>
              <label htmlFor="admin-user-filter" className="sr-only">
                Filtrar usuarios
              </label>
              <div className="relative">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  aria-hidden
                />
                <input
                  id="admin-user-filter"
                  type="search"
                  autoComplete="off"
                  placeholder="Buscar por nombre, usuario, vendedor o ID…"
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
                    <XMarkIcon className="h-5 w-5" aria-hidden />
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
            <div className="overflow-x-auto">
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
                    <th className="p-5 text-left">USUARIO</th>
                    <th className="p-5 text-left">ADMIN</th>
                    <th className="p-5 text-left">VENDEDOR</th>
                    <th className="p-5 text-left">DESCUENTO</th>
                    <th className="p-5 text-left">CLIENTE</th>
                    <th className="p-5 text-left">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="p-5">{user._id.substring(20, 24)}</td>
                      <td className="p-5">{user.name}</td>
                      <td className="p-5">{user.username}</td>
                      <td className="p-5">{user.isAdmin ? "SI" : "NO"}</td>
                      <td className="p-5">{user.seller}</td>
                      <td className="p-5">{user.clientDiscount}</td>
                      <td className="p-5">{user.isClient ? "SI" : "NO"}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/user/${user._id}`}
                            className="icon-button"
                            aria-label="Editar usuario"
                            title="Editar"
                          >
                            <PencilSquareIcon className="h-5 w-5" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            className="icon-button-danger"
                            aria-label="Eliminar usuario"
                            title="Eliminar"
                            onClick={() => deleteHandler(user._id)}
                          >
                            <TrashIcon className="h-5 w-5" aria-hidden />
                          </button>
                        </div>
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

AdminUsersScreen.auth = { adminOnly: true };
export default AdminUsersScreen;
