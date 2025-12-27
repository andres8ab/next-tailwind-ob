import Layout from '@/components/Layout'
import Product from '@/models/Product'
import { Store } from '@/utils/Store'
import db from '@/utils/db'
import axios from 'axios'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'
import { toast } from 'react-toastify'

export default function ProductScreen(props) {
  const { product } = props
  const { state, dispatch } = useContext(Store)
  const router = useRouter()
  if (!product) {
    return (
      <Layout tittle="Producto No Encontrado">Producto No Encontrado</Layout>
    )
  }

  const addToCartHandler = async () => {
    const existItem = state.cart.cartItems.find((x) => x.slug === product.slug)
    const quantity = existItem ? existItem.quantity + 1 : 1
    const { data } = await axios.get(`/api/products/${product._id}`)

    if (data.countInStock < quantity) {
      return toast.error('Lo sentimos. El producto está agotado')
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } })
    toast.success('Producto agregado al carrito')
  }

  return (
    <Layout title={product.name}>
      <div className="py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          ‹ Regresar
        </button>
      </div>
      <div className="grid lg:grid-cols-4 md:grid-cols-2 md:gap-3">
        <div className="md:col-span-2 max-w-xs">
          <Image
            src={product.image}
            alt={product.name}
            width={640}
            height={640}
            priority
          ></Image>
        </div>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{product.name}</h1>
          </div>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Categoria:</span>
              <span>{product.category}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Marca:</span>
              <span>{product.brand}</span>
            </li>
            <li className="flex flex-col gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Descripción:</span>
              <span className="text-gray-600 dark:text-gray-400">{product.description}</span>
            </li>
          </ul>
        </div>
        <div>
          <div className="card p-6">
            <div className="mb-4 flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Precio</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-500">${product.price.toLocaleString()}</div>
            </div>
            <div className="mb-4 flex justify-between items-center">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Status</div>
              <div className={`font-medium ${product.countInStock > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {product.countInStock > 0 ? 'Disponible' : 'Agotado'}
              </div>
            </div>
            <button
              className="primary-button w-full"
              onClick={addToCartHandler}
              disabled={product.countInStock === 0}
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  const { params } = context
  const { slug } = params

  await db.connect()
  const product = await Product.findOne({ slug }).lean()
  await db.disconnect()
  return {
    props: {
      product: product ? db.convertDocToObj(product) : null,
    },
  }
}
