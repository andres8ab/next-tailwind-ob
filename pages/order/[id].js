import axios from 'axios'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useReducer, useState } from 'react'
import Layout from '@/components/Layout'
import { getError } from '@/utils/error'
import { toast } from 'react-toastify'
import MercadoPagoButton from '@/components/MercadoPagoButton'
// import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, order: action.payload, error: '' }
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload }
    case 'DELIVER_REQUEST':
      return { ...state, loadingDeliver: true }
    case 'DELIVER_SUCCESS':
      return { ...state, loadingDeliver: false, successDeliver: true }
    case 'DELIVER_FAIL':
      return { ...state, loadingDeliver: false }
    case 'DELIVER_RESET':
      return { ...state, loadingDeliver: false, successDeliver: false }
    default:
      return state
  }
}

function OrderScreen() {
  // const [preferenceId, setPreferenceId] = useState(null);
  // initMercadoPago('APP_USR-d9cf7890-d97e-4104-989a-607016a300af');

  const { data: session } = useSession()

  const { query } = useRouter()
  const orderId = query.id

  const [{ loading, error, order, loadingDeliver, successDeliver }, dispatch] =
    useReducer(reducer, {
      loading: true,
      order: {},
      error: '',
    })
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' })
        const { data } = await axios.get(`/api/orders/${orderId}`)
        dispatch({ type: 'FETCH_SUCCESS', payload: data })
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) })
      }
    }
    if (!order._id || successDeliver || (order._id && order._id !== orderId)) {
      fetchOrder()
      if (successDeliver) {
        dispatch({ type: 'DELIVER_RESET' })
      }
    }
  }, [order._id, orderId, successDeliver])
  const {
    shippingAddress,
    paymentMethod,
    orderItems,
    itemsPrice,
    discountPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
  } = order

  const [inputValue, setInputValue] = useState('')
  const handleChange = (event) => {
    setInputValue(event.target.value)
  }

  async function deliverOrderHandler() {
    try {
      dispatch({ type: 'DELIVER_REQUEST' })
      const { data } = await axios.put(
        `/api/admin/orders/${order._id}/deliver`,
        { inputValue }
      )
      dispatch({ type: 'DELIVER_SUCCESS', payload: data })
      toast.success('Orden entregada')
    } catch (err) {
      dispatch({ type: 'FETCH_FAIL', payload: getError(err) })
      toast.error(getError(err))
    }
  }

  // const createPreference = async () => {
  //   try {
  //     const response = await axios.post('/api/orders/mercadopago', {
  //       description: orderId,
  //       price: totalPrice,
  //       quantity: 1,
  //     });
  //     const { id } = response.data;
  //     return id;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const handleBuy = async () => {
  //   const id = await createPreference();
  //   if (id) {
  //     setPreferenceId(id);
  //   }
  // };

  return (
    <Layout title={`Orden ${orderId}`}>
      <h1 className="mb-4 text-xl">{`Orden ${orderId}`}</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div className="alert-error">{error}</div>
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <div className="card p-5">
              <h2 className="mb-2 text-lg">Dirección Envío</h2>
              <div>
                {shippingAddress.fullName}, {shippingAddress.nit},{' '}
                {shippingAddress.address}, {shippingAddress.city}
              </div>
              {isDelivered ? (
                <div className="alert-success">
                  Entregado con el Numero de Guia: {deliveredAt}
                </div>
              ) : (
                <div>
                  <div className="alert-error">No Entregado</div>
                  {session.user.isAdmin && !order.isDelivered && (
                    <li>
                      {loadingDeliver && <div>Cargando...</div>}
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleChange}
                        placeholder="Guia #"
                        className="input bg-teal-600/50 input-bordered input-accent w-full max-w-xs"
                      />
                      <button
                        className="btn btn-accent"
                        onClick={deliverOrderHandler}
                      >
                        Enviar
                      </button>
                    </li>
                  )}
                </div>
              )}
            </div>
            <div className="card p-5">
              <h2 className="mb-2 text-lg">Método Pago</h2>
              <div>{paymentMethod}</div>
              {isPaid ? (
                <div className="alert-success">Pagado: {paidAt}</div>
              ) : (
                <div>
                  <div className="alert-error">No Pagado</div>
                  <MercadoPagoButton product={order} />
                  {/* <button className="alert-pay" onClick={handleBuy}>
                    Pagar
                  </button> */}
                  {/* {preferenceId && (
                    <Wallet
                      initialization={{ preferenceId, redirectMode: 'modal' }}
                    />
                  )} */}
                </div>
              )}
            </div>
            <div className="card overflow-x-auto p-5">
              <h2 className="mb-2 text-lg">Enviar Orden</h2>
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 text-left">Item</th>
                    <th className="px-5 text-right">Cantidad</th>
                    <th className="px-5 text-right">Precio</th>
                    <th className="px-5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item._id} className="border-b">
                      <td>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center"
                        >
                          <Image
                            className="h-auto w-auto"
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          ></Image>
                          &nbsp;
                          {item.name}
                        </Link>
                      </td>
                      <td className="p-5 text-right">{item.quantity}</td>
                      <td className="p-5 text-right">${item.price}</td>
                      <td className="p-5 text-right">
                        ${item.quantity * item.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="card p-5">
              <h2 className="mb-2 text-lg">Resumen Orden</h2>
              <ul>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Items</div>
                    <div>${itemsPrice}</div>
                  </div>
                </li>{' '}
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Dcto.</div>
                    <div>${discountPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Iva</div>
                    <div>${taxPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Envío</div>
                    <div>${shippingPrice}</div>
                  </div>
                </li>
                <li>
                  <div className="mb-2 flex justify-between">
                    <div>Total</div>
                    <div>${totalPrice}</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

OrderScreen.auth = true
export default OrderScreen
