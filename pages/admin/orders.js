import axios from 'axios'
import Link from 'next/link'
import React, { useEffect, useReducer } from 'react'
import Layout from '@/components/Layout'
import { getError } from '@/utils/error'
import { toast } from 'react-toastify'

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, orders: action.payload, error: '' }
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload }
    case 'DELETE_REQUEST':
      return { ...state, loadingDelete: true }
    case 'DELETE_SUCCESS':
      return { ...state, loadingDelete: false, successDelete: true }
    case 'DELETE_FAIL':
      return { ...state, loadingDelete: false }
    case 'DELETE_RESET':
      return { ...state, loadingDelete: false, successDelete: false }
    default:
      state
  }
}

export default function AdminOrderScreen() {
  const [{ loading, error, orders, loadingDelete, successDelete }, dispatch] =
    useReducer(reducer, {
      loading: true,
      orders: [],
      error: '',
    })

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' })
        const { data } = await axios.get(`/api/admin/orders`)
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

  const deleteHandler = async (orderId) => {
    if (!window.confirm('Estas seguro que deseas eliminar?')) {
      return
    }
    try {
      dispatch({ type: 'DELETE_REQUEST' })
      await axios.delete(`/api/admin/orders/${orderId}`)
      dispatch({ type: 'DELETE_SUCCESS' })
      toast.success('Orden eliminada correctamente')
    } catch (err) {
      dispatch({ type: 'DELETE_FAIL' })
      toast.error(getError(err))
    }
  }

  return (
    <Layout title="Admin Ordenes">
      <div className="grid md:grid-cols-4 md:gap-5">
        <div>
          <ul>
            <li>
              <Link href="/admin/dashboard">Admin Panel</Link>
            </li>
            <li>
              <Link href="/admin/orders" className="font-bold">
                Ordenes
              </Link>
            </li>
            <li>
              <Link href="/admin/products">Productos</Link>
            </li>
            <li>
              <Link href="/admin/users">Usuarios</Link>
            </li>
          </ul>
        </div>
        <div className="overflow-x-auto md:col-span-3">
          {loadingDelete && <div>Eliminando...</div>}
          <h1 className="mb-4 text-xl">Admin Ordenes</h1>

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
                    <th className="p-5 text-left">USUARIO</th>
                    <th className="p-5 text-left">FECHA</th>
                    <th className="p-5 text-left">TOTAL</th>
                    <th className="p-5 text-left">PAGADO</th>
                    <th className="p-5 text-left">ENTREGADO</th>
                    <th className="p-5 text-left">ACCION</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b">
                      <td className="p-5">{order._id.substring(20, 24)}</td>
                      <td className="p-5">
                        {order.shippingAddress
                          ? order.shippingAddress.fullName
                          : 'USUARIO BORRADO'}
                      </td>
                      <td className="p-5">
                        {order.createdAt.substring(0, 10)}
                      </td>
                      <td className="p-5">
                        {order.totalPrice.toLocaleString()}
                      </td>
                      <td className="p-5">
                        {order.isPaid
                          ? `${order.paidAt.substring(0, 10)}`
                          : 'no pagada'}
                      </td>
                      <td className="p-5">
                        {order.isDelivered
                          ? `${order.deliveredAt}`
                          : 'no entregada'}
                      </td>
                      <td className="p-5">
                        <Link href={`/order/${order._id}`}>Detalles</Link>
                        &nbsp;
                        <button onClick={() => deleteHandler(order._id)}>
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

AdminOrderScreen.auth = { adminOnly: true }
