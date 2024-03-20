import Layout from '@/components/Layout'
import ProductItem from '@/components/ProductItem'
import Product from '@/models/Product'
import { Store } from '@/utils/Store'
import db from '@/utils/db'
import axios from 'axios'
import Image from 'next/image'
import { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import Tilt from 'react-parallax-tilt'
import { motion } from 'framer-motion'
import { fadeIn } from '@/utils/motion'
import SearchBar from '@/components/SearchBar'

const productsDetails = [
  {
    title: 'Alternador',
    icon: '/images/AL-076.png',
  },
  {
    title: 'Arranque',
    icon: '/images/AR-027.png',
  },
  {
    title: 'Piezas Alternador',
    icon: '/images/RA-051.png',
  },
  {
    title: 'Piezas Arranque',
    icon: '/images/ZM-893.png',
  },
  {
    title: 'Motoventilador',
    icon: '/images/12-12V.png',
  },
  {
    title: 'Distribuidor',
    icon: '/images/AP-005.png',
  },
  {
    title: 'Refrigeracion',
    icon: '/images/2011945.png',
  },
  {
    title: 'Pera',
    icon: '/images/YZ-022.png',
  },
]

const ServiceCard = ({ index, title, icon }) => {
  return (
    <Tilt className="xs:w-[250px] w-full">
      <motion.div
        variants={fadeIn('right', 'spring', 0.5 * index, 0.75)}
        className="w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card cursor-pointer"
      >
        <div
          options={{
            max: 45,
            scale: 1,
            speed: 450,
          }}
          className="rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col"
        >
          <Image
            src={icon}
            alt={title}
            className="object-contain"
            width={300}
            height={300}
          />
          <h3 className="text-white text-[20px] font-bold text-center">
            {title}
          </h3>
          <button onClick={(e) => e.stopPropagation()}></button>
        </div>
      </motion.div>
    </Tilt>
  )
}

export default function Home({ products }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [modal, setModal] = useState(true)

  const categoryHandler = (categoryId) => {
    setSelectedCategory(categoryId)
    setModal(!modal)
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }
  const { state, dispatch } = useContext(Store)
  const { cart } = state
  const handleReturn = () => {
    setModal(true)
  }

  const addToCartHandler = async (product) => {
    const existItem = cart.cartItems.find((x) => x.slug === product.slug)
    const quantity = existItem ? existItem.quantity + 1 : 1
    const { data } = await axios.get(`/api/products/${product._id}`)

    if (data.countInStock < quantity) {
      return toast.error('Lo sentimos. El producto está agotado')
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } })
    toast.success('Producto agregado al carrito')
  }

  return (
    <Layout title="Home">
      <div className="mx-auto pt-4 flex justify-center md:hidden">
        <SearchBar />
      </div>
      {modal ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-6">
          {productsDetails.map((productDetail, index) => (
            <div
              key={productDetail.title}
              onClick={() => categoryHandler(productDetail.title)}
            >
              <ServiceCard index={index} {...productDetail} />
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-4">
          <button
            className="btn btn-outline btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
            onClick={() => handleReturn()}
          >
            ‹ Regresar
          </button>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-12">
            {products
              .filter(
                (product) =>
                  product.countInStock > 0 &&
                  product.category === selectedCategory
              )
              .map((product) => (
                <ProductItem
                  addToCartHandler={addToCartHandler}
                  product={product}
                  key={product.slug}
                ></ProductItem>
              ))}
          </div>
        </div>
      )}
    </Layout>
  )
}

export async function getServerSideProps() {
  await db.connect()
  const products = await Product.find().sort({ slug: 1 }).lean()
  return {
    props: {
      products: products.map(db.convertDocToObj),
    },
  }
}
