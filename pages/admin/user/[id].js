import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useEffect, useReducer } from 'react'
import { getError } from '../../../utils/error'
import Layout from '../../../components/Layout'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import Link from 'next/link'

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, error: '' }
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload }
    case 'UPDATE_REQUEST':
      return { ...state, loadingUpdate: true, errorUpdate: '' }
    case 'UPDATE_SUCCESS':
      return { ...state, loadingUpdate: false, errorUpdate: '' }
    case 'UPDATE_FAIL':
      return { ...state, loadingUpdate: false, errorUpdate: action.payload }
    case 'UPLOAD_REQUEST':
      return { ...state, loadingUpload: true, errorUpload: '' }
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        loadingUpload: false,
        errorUpload: '',
      }
    case 'UPLOAD_FAIL':
      return { ...state, loadingUpload: false, errorUpload: action.payload }

    default:
      return state
  }
}

function AdminUserEdit() {
  const { query } = useRouter()
  const userId = query.id
  const [{ loading, error, loadingUpdate }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' })
        const { data } = await axios.get(`/api/admin/users/${userId}`)

        dispatch({ type: 'FETCH_SUCCESS' })
        setValue('name', data.name)
        setValue('username', data.username)
        setValue('fullName', data.shippingAddress.fullName)
        setValue('address', data.shippingAddress.address)
        setValue('nit', data.shippingAddress.nit)
        setValue('city', data.shippingAddress.city)
        setValue('seller', data.seller)
        setValue('clientDiscount', data.clientDiscount)
        setValue('isClient', data.isClient)
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) })
      }
    }
    fetchData()
  }, [userId, setValue])

  const submitHandler = async ({
    name,
    username,
    fullName,
    address,
    nit,
    city,
    seller,
    clientDiscount,
    isClient,
  }) => {
    try {
      dispatch({ type: 'UPDATE_REQUEST' })
      await axios.put(`/api/admin/users/${userId}`, {
        name,
        username,
        fullName,
        address,
        nit,
        city,
        seller,
        clientDiscount,
        isClient,
      })
      dispatch({ type: 'UPDATE_SUCCESS' })
      toast.success('User updated successfully')
      router.push('/admin/users')
    } catch (err) {
      dispatch({ type: 'UPDATE_FAIL', payload: getError(err) })
      toast.error(getError(err))
    }
  }
  return (
    <Layout title={`Editar Usuario ${userId}`}>
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
              <Link href="/admin/users">Productos</Link>
            </li>
            <li>
              <Link href="/admin/users" className="font-bold">
                Usuarios
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-3">
          {loading ? (
            <div>Cargando...</div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : (
            <form
              className="mx-auto max-w-screen-md"
              onSubmit={handleSubmit(submitHandler)}
            >
              <h1 className="mb-4 text-xl">{`Edit User ${userId}`}</h1>
              <div className="mb-4">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  className="w-full"
                  id="name"
                  autoFocus
                  {...register('name', {
                    required: 'Ingrese Nombre',
                  })}
                />
                {errors.name && (
                  <div className="text-red-500">{errors.name.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="username">usuario</label>
                <input
                  type="text"
                  className="w-full"
                  id="username"
                  autoFocus
                  {...register('username', {
                    required: 'Ingrese nit sin digito',
                  })}
                />
                {errors.username && (
                  <div className="text-red-500">{errors.username.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="fullName">Nombre comercial</label>
                <input
                  type="text"
                  className="w-full"
                  id="fullName"
                  autoFocus
                  {...register('fullName', {
                    required: 'Ingrese el nombre',
                  })}
                />
                {errors.fullName && (
                  <div className="text-red-500">{errors.fullName.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="address">Dirección</label>
                <input
                  type="text"
                  className="w-full"
                  id="address"
                  autoFocus
                  {...register('address', {
                    required: 'Ingrese la dirección',
                  })}
                />
                {errors.address && (
                  <div className="text-red-500">{errors.address.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="nit">Nit</label>
                <input
                  type="text"
                  className="w-full"
                  id="nit"
                  autoFocus
                  {...register('nit', {
                    required: 'Ingrese el nit con digito',
                  })}
                />
                {errors.nit && (
                  <div className="text-red-500">{errors.nit.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="city">Ciudad</label>
                <input
                  type="text"
                  className="w-full"
                  id="city"
                  autoFocus
                  {...register('city', {
                    required: 'Ingrese la ciudad',
                  })}
                />
                {errors.city && (
                  <div className="text-red-500">{errors.city.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="seller">Vendedor</label>
                <select
                  type="text"
                  className="w-full"
                  id="seller"
                  autoFocus
                  {...register('seller', {
                    required: 'Seleccione el vendedor',
                  })}
                >
                  <option value="">Selecciona...</option>
                  <option value="Carlos Robledo">Carlos Robledo</option>
                  <option value="Andres Ochoa">Andres Ochoa</option>
                  <option value="Carlos Palacio">Carlos Palacio</option>
                </select>
                {errors.seller && (
                  <div className="text-red-500">{errors.seller.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="clientDiscount">Descuento</label>
                <input
                  type="text"
                  className="w-full"
                  id="clientDiscount"
                  autoFocus
                  {...register('clientDiscount', {
                    required: 'Ingrese el descuento',
                  })}
                />
                {errors.clientDiscount && (
                  <div className="text-red-500">
                    {errors.clientDiscount.message}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="isClient">Es Cliente</label>
                <input
                  type="checkbox"
                  className="w-full"
                  id="isClient"
                  {...register('isClient')}
                />

                {errors.isClient && (
                  <div className="text-red-500">{errors.isClient.message}</div>
                )}
              </div>
              <div className="mb-4">
                <button disabled={loadingUpdate} className="primary-button">
                  {loadingUpdate ? 'Cargando' : 'Actualizar'}
                </button>
              </div>
              <div className="mb-4">
                <Link href={`/admin/users`}>Regresar</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}

AdminUserEdit.auth = { adminOnly: true }
export default AdminUserEdit
