import Layout from '@/components/Layout';
import ProductItem from '@/components/ProductItem';
import Product from '@/models/Product';
import { Store } from '@/utils/Store';
import db from '@/utils/db';
import axios from 'axios';
import { useContext } from 'react';
import { toast } from 'react-toastify';

export default function Home({ products }) {
  const { state, dispatch } = useContext(Store);
  const { cart } = state;

  const addToCartHandler = async (product) => {
    const existItem = cart.cartItems.find((x) => x.slug === product.slug);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);

    if (data.countInStock < quantity) {
      return toast.error('Lo sentimos. El producto está agotado');
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } });
    toast.success('Producto agregado al carrito');
  };

  return (
    <Layout title="Home">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products
          .filter((product) => product.countInStock > 0)
          .map((product) => (
            <ProductItem
              addToCartHandler={addToCartHandler}
              product={product}
              key={product.slug}
            ></ProductItem>
          ))}
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  await db.connect();
  const products = await Product.find().sort({ slug: 1 }).lean();
  return {
    props: {
      products: products.map(db.convertDocToObj),
    },
  };
}
