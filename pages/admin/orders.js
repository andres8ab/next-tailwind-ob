import axios from 'axios'
import Link from 'next/link'
import React, { useEffect, useReducer } from 'react'
import Layout from '@/components/Layout'
import { getError } from '@/utils/error'
import { enviaGuiaHref, isEnviaGuia } from '@/utils/envia'
import { toast } from 'react-toastify'
import {
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

const badgeBase =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium'

// Los tres estados de entrega se derivan de isDelivered + el contenido de
// deliveredAt (que guarda el numero de guia, no una fecha).
function getDeliveryStatus(order) {
  if (!order.isDelivered) {
    return {
      key: 'pending',
      label: 'Pendiente',
      Icon: ExclamationTriangleIcon,
      href: '',
      rowClass:
        'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30',
      badgeClass: `${badgeBase} border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100`,
    }
  }
  if (isEnviaGuia(order.deliveredAt)) {
    return {
      key: 'envia',
      label: order.deliveredAt,
      Icon: TruckIcon,
      href: enviaGuiaHref(order.deliveredAt),
      rowClass:
        'bg-green-50/60 hover:bg-green-50 dark:bg-green-950/20 dark:hover:bg-green-950/30',
      // !no-underline y !text-* porque globals.css pinta todo <a> de azul/teal
      badgeClass: `${badgeBase} border-green-200 bg-green-50 !text-green-900 !no-underline transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:!text-green-100 dark:hover:bg-green-950/60`,
    }
  }
  return {
    key: 'delivered',
    label: order.deliveredAt,
    Icon: null,
    href: '',
    rowClass:
      'bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30',
    badgeClass: `${badgeBase} border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100`,
  }
}

function DeliveryBadge({ status }) {
  const { Icon, label, href, badgeClass } = status
  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      <span>{label}</span>
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title="Ver guía en Envia"
        aria-label={`Abrir etiqueta de guía ${label} en Envia`}
        className={badgeClass}
      >
        {content}
      </a>
    )
  }
  return <span className={badgeClass}>{content}</span>
}

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
                    <th className="p-5 text-left">USUARIO</th>
                    <th className="p-5 text-left">FECHA</th>
                    <th className="p-5 text-left">TOTAL</th>
                    <th className="p-5 text-left">ENTREGADO</th>
                    <th className="p-5 text-left">ACCION</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = getDeliveryStatus(order)
                    return (
                      <tr
                        key={order._id}
                        className={`border-b transition-colors ${status.rowClass}`}
                      >
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
                          <DeliveryBadge status={status} />
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/order/${order._id}`}
                              className="icon-button"
                              aria-label="Ver detalles de la orden"
                              title="Detalles"
                            >
                              <EyeIcon className="h-5 w-5" aria-hidden />
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteHandler(order._id)}
                              className="icon-button-danger"
                              aria-label="Eliminar orden"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
