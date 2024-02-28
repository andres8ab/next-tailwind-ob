import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'
import { toast } from 'react-toastify'
import Layout from '@/components/Layout'
import { Store } from '@/utils/Store'
import XCircleIcon from '@heroicons/react/24/outline/XCircleIcon'
import ProductItem from '@/components/ProductItem'
import Product from '@/models/Product'
import db from '@/utils/db'
import SearchBar from '@/components/SearchBar'

const PAGE_SIZE = 6

const prices = [
  {
    name: '$1 to $50000',
    value: '1-50000',
  },
  {
    name: '$50001 to $200000',
    value: '50001-200000',
  },
  {
    name: '$200001 to $1000000',
    value: '200001-1000000',
  },
]

export default function Search(props) {
  const router = useRouter()

  const {
    query = 'all',
    category = 'all',
    brand = 'all',
    price = 'all',
    sort = 'featured',
    page = 1,
  } = router.query

  const { products, countProducts, categories, brands, pages } = props

  const filterSearch = ({
    page,
    category,
    brand,
    sort,
    min,
    max,
    searchQuery,
    price,
  }) => {
    const { query } = router
    if (page) query.page = page
    if (searchQuery) query.searchQuery = searchQuery
    if (sort) query.sort = sort
    if (category) query.category = category
    if (brand) query.brand = brand
    if (price) query.price = price
    if (min) query.min ? query.min : query.min === 0 ? 0 : min
    if (max) query.max ? query.max : query.max === 0 ? 0 : max

    router.push({
      pathname: router.pathname,
      query: query,
    })
  }
  const categoryHandler = (e) => {
    filterSearch({ category: e.target.value })
  }
  const pageHandler = (page) => {
    filterSearch({ page })
  }
  const brandHandler = (e) => {
    filterSearch({ brand: e.target.value })
  }
  const sortHandler = (e) => {
    filterSearch({ sort: e.target.value })
  }
  const priceHandler = (e) => {
    filterSearch({ price: e.target.value })
  }

  const { state, dispatch } = useContext(Store)
  const addToCartHandler = async (product) => {
    const existItem = state.cart.cartItems.find((x) => x._id === product._id)
    const quantity = existItem ? existItem.quantity + 1 : 1
    const { data } = await axios.get(`/api/products/${product._id}`)
    if (data.countInStock < quantity) {
      toast.error('Lo sentimos. El producto está agotado')
      return
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } })
    router.push('/cart')
  }
  return (
    <Layout title="buscar">
      <div className="flex md:hidden">
        <SearchBar />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 md:gap-5">
        <div>
          <div className="my-3">
            <h2>Categorias</h2>
            <select
              className="w-full"
              value={category}
              onChange={categoryHandler}
            >
              <option value="all">Todas</option>
              {categories &&
                categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-3">
            <h2>Marca</h2>
            <select className="w-full" value={brand} onChange={brandHandler}>
              <option value="all">Todas</option>
              {brands &&
                brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-3">
            <h2>Precio</h2>
            <select className="w-full" value={price} onChange={priceHandler}>
              <option value="all">Todas</option>
              {prices &&
                prices.map((price) => (
                  <option key={price.value} value={price.value}>
                    {price.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="mb-2 flex items-center justify-between border-b-2 pb-2">
            <div className="flex items-center">
              {products.length === 0 ? 'No' : countProducts} Resultados
              {query !== 'all' && query !== '' && ' : ' + query}
              {category !== 'all' && ' : ' + category}
              {brand !== 'all' && ' : ' + brand}
              {price !== 'all' && ' : Price ' + price}
              {(query !== 'all' && query !== '') ||
              category !== 'all' ||
              brand !== 'all' ||
              price !== 'all' ? (
                <button onClick={() => router.push('/search')}>
                  <XCircleIcon className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <div>
              Ordenar por{' '}
              <select value={sort} onChange={sortHandler}>
                <option value="featured">Destacados</option>
                <option value="lowest">Precio: Bajo a Alto</option>
                <option value="highest">Precio: Alto a Bajo</option>
                <option value="newest">Última Importación</option>
              </select>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductItem
                  key={product._id}
                  product={product}
                  addToCartHandler={addToCartHandler}
                />
              ))}
            </div>
            <ul className="flex flex-wrap">
              {products.length > 0 &&
                [...Array(pages).keys()].map((pageNumber) => (
                  <li key={pageNumber}>
                    <button
                      className={`default-button m-2 ${
                        page == pageNumber + 1 ? 'font-bold' : ''
                      }`}
                      onClick={() => pageHandler(pageNumber + 1)}
                    >
                      {pageNumber + 1}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ query }) {
  const pageSize = query.pageSize || PAGE_SIZE
  const page = query.page || 1
  const category = query.category || ''
  const brand = query.brand || ''
  const price = query.price || ''
  const sort = query.sort || ''
  const searchQuery = query.query || ''

  const queryFilter =
    searchQuery && searchQuery !== 'all'
      ? {
          name: {
            $regex: searchQuery,
            $options: 'i',
          },
        }
      : {}
  const categoryFilter = category && category !== 'all' ? { category } : {}
  const brandFilter = brand && brand !== 'all' ? { brand } : {}
  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {}
  const order =
    sort === 'featured'
      ? { isFeatured: -1 }
      : sort === 'lowest'
      ? { price: 1 }
      : sort === 'highest'
      ? { price: -1 }
      : sort === 'newest'
      ? { createdAt: -1 }
      : { slug: 1 }

  await db.connect()
  const categories = await Product.find().distinct('category')
  const brands = await Product.find().distinct('brand')
  const productDocs = await Product.find({
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...brandFilter,
  })
    .sort(order)
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .lean()
  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...brandFilter,
  })
  await db.disconnect()
  const products = productDocs.map(db.convertDocToObj)

  return {
    props: {
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
      categories,
      brands,
    },
  }
}
