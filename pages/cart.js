import Layout from '@/components/Layout'
import { Store } from '@/utils/Store'
import Image from 'next/image'
import Link from 'next/link'
import React, { useContext } from 'react'
import XCricleIcon from '@heroicons/react/24/outline/XCircleIcon'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { toast } from 'react-toastify'

function CartScreen() {
  const router = useRouter()
  const { state, dispatch } = useContext(Store)
  const {
    cart: { cartItems },
  } = state
  const removeItemHandler = (item) => {
    dispatch({ type: 'CART_REMOVE_ITEM', payload: item })
  }
  const updateCartHandler = async (item, qty) => {
    const quantity = Number(qty)
    const { data } = await axios.get(`/api/products/${item._id}`)
    if (data.countInStock < quantity) {
      return toast.error('Lo sentimos. El producto está agotado')
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } })
    toast.success('Producto actualizado en el carrito')
  }

  const proceedOrderHandler = () => {
    router.push('login?redirect=/shipping')
  }

  return (
    <Layout title="Carrito">
      <h1 className="mb-4 text-xl">Carrito</h1>
      {cartItems.length === 0 ? (
        <div>
          El Carrito está vacío. <Link href="/">Agrega productos</Link>
        </div>
      ) : (
        <div className="text-sm grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Item</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">Cantidad</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">Precio</th>
                  <th className="px-5 py-3 font-semibold text-gray-900 dark:text-gray-100">Accion</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.slug} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-5">
                      <Link
                        href={`/product/${item.slug}`}
                        className="flex items-center gap-3 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Image
                          className="w-auto h-auto rounded"
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        ></Image>
                        <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
                      </Link>
                    </td>
                    <td className="p-5 text-right">
                      <select
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartHandler(item, e.target.value)
                        }
                        className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5 outline-none ring-red-300 dark:ring-red-700 focus:ring-2 focus:border-red-500 dark:focus:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {[...Array(item.countInStock).keys()].map((x) => (
                          <option key={x + 1} value={x + 1}>
                            {x + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-5 text-right text-gray-900 dark:text-gray-100 font-medium">${item.price}</td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => removeItemHandler(item)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded"
                      >
                        <XCricleIcon
                          className="h-5 w-5"
                        ></XCricleIcon>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card p-5">
            <ul>
              <li>
                <div className="pb-3 text-xl">
                  Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)}) : $
                  {cartItems.reduce((a, c) => a + c.quantity * c.price, 0)}
                </div>
              </li>
              <li>
                <button
                  onClick={proceedOrderHandler}
                  className="primary-button w-full"
                >
                  Continuar Compra
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default dynamic(() => Promise.resolve(CartScreen), { ssr: false })
