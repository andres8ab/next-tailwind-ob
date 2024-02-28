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
          className="text-blue-600 hover:text-blue-800"
        >
          regresar
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
        <div>
          <ul>
            <li>
              <h1 className="text.lg">{product.name}</h1>
            </li>
            <li>Categoria: {product.category}</li>
            <li>Marca: {product.brand}</li>
            <li>Decripcion: {product.description}</li>
          </ul>
        </div>
        <div>
          <div className="card p-5">
            <div className="mb-2 flex justify-between">
              <div>Precio</div>
              <div>${product.price}</div>
            </div>
            <div className="mb-2 flex justify-between">
              <div>Status</div>
              <div>{product.countInStock > 0 ? 'Disponible' : 'Agotado'}</div>
            </div>
            <button
              className="primary-button w-full"
              onClick={addToCartHandler}
            >
              Agrega al Carrito
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
