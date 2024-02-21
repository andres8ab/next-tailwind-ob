import { useRouter } from 'next/router'
const { default: axios } = require('axios')
const { default: Link } = require('next/link')
const { useReducer, useEffect } = require('react')
const { toast } = require('react-toastify')
const { default: Layout } = require('@/components/Layout')
const { getError } = require('@/utils/error')

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, users: action.payload, error: '' }
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload }
    case 'CREATE_REQUEST':
      return { ...state, loadingCreate: true }
    case 'CREATE_SUCCESS':
      return { ...state, loadingCreate: false }
    case 'CREATE_FAIL':
      return { ...state, loadingCreate: false }
    case 'DELETE_REQUEST':
      return { ...state, loadingDelete: true }
    case 'DELETE_SUCCESS':
      return { ...state, loadingDelete: false, successDelete: true }
    case 'DELETE_FAIL':
      return { ...state, loadingDelete: false }
    case 'DELETE_RESET':
      return { ...state, loadingDelete: false, successDelete: false }
    default:
      return state
  }
}

function AdminUsersScreen() {
  const router = useRouter()
  const [
    { loading, error, users, successDelete, loadingCreate, loadingDelete },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    users: [],
    error: '',
  })

  const sortedUsers = users.sort(function (a, b) {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }
    return 0
  })

  const createHandler = async () => {
    if (!window.confirm('Estas seguro?')) {
      return
    }
    try {
      dispatch({ type: 'CREATE_REQUEST' })
      const { data } = await axios.post(`/api/admin/users`)
      dispatch({ type: 'CREATE_SUCCESS' })
      toast.success('Usuario creado correctamente')
      router.push(`/admin/user/${data.user._id}`)
    } catch (err) {
      dispatch({ type: 'CREATE_FAIL' })
      toast.error(getError(err))
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' })
        const { data } = await axios.get(`/api/admin/users`)
        dispatch({ type: 'FETCH_SUCCESS', payload: data })
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) })
      }
    }
    if (successDelete) {
      dispatch({ type: 'DELETE_RESET' })
    } else {
      fetchData()
    }
  }, [successDelete])

  const deleteHandler = async (userId) => {
    if (!window.confirm('Esta seguro de eliminar?')) {
      return
    }
    try {
      dispatch({ type: 'DELETE_REQUEST' })
      await axios.delete(`/api/admin/users/${userId}`)
      dispatch({ type: 'DELETE_SUCCESS' })
      toast.success('Usuario eliminado correctamente')
    } catch (err) {
      dispatch({ type: 'DELETE_FAIL' })
      toast.error(getError(err))
    }
  }

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
          <h1 className="mb-4 text-xl">Usuarios</h1>
          {loadingDelete && <div>Eliminando...</div>}
          <button
            disabled={loadingCreate}
            onClick={createHandler}
            className="primary-button"
          >
            {loadingCreate ? 'Cargando' : 'Crear'}
          </button>
          {loading ? (
            <div>Cargando...</div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 text-left">ID</th>
                    <th className="p-5 text-left">NOMBRE</th>
                    <th className="p-5 text-left">USUARIO</th>
                    <th className="p-5 text-left">ADMIN</th>
                    <th className="p-5 text-left">CLIENTE</th>
                    <th className="p-5 text-left">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user._id} className="border-b">
                      <td className="p-5">{user._id.substring(20, 24)}</td>
                      <td className="p-5">{user.name}</td>
                      <td className="p-5">{user.username}</td>
                      <td className="p-5">{user.isAdmin ? 'SI' : 'NO'}</td>
                      <td className="p-5">{user.isClient ? 'SI' : 'NO'}</td>
                      <td className="p-5">
                        <Link
                          href={`/admin/user/${user._id}`}
                          type="button"
                          className="default-button"
                        >
                          Editar
                        </Link>
                        &nbsp;
                        <button
                          type="button"
                          className="default-button"
                          onClick={() => deleteHandler(user._id)}
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
  )
}

AdminUsersScreen.auth = { adminOnly: true }
export default AdminUsersScreen
