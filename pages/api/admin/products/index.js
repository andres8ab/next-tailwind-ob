import Product from '@/models/Product';
import db from '@/utils/db';
import { getToken } from 'next-auth/jwt';

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user || !user.isAdmin) {
    return res.status(401).send('Sesión admin requerida');
  }
  if (req.method === 'GET') {
    return getHandler(req, res);
  } else if (req.method === 'POST') {
    return postHandler(req, res);
  } else {
    return res.status(400).send({ message: 'Método no permitido' });
  }
};
const postHandler = async (req, res) => {
  await db.connect();
  const newProduct = new Product({
    name: 'AL-200 Alternador Tesla',
    slug: '1_AL-200',
    image: '/images/AL-200.png',
    price: 500000,
    category: 'Alternador',
    brand: 'OB',
    countInStock: 50,
    description: '12V 100A',
    group: 'eob',
  });

  const product = await newProduct.save();
  await db.disconnect();
  res.send({ message: 'Producto creado correctamente', product });
};

const getHandler = async (req, res) => {
  await db.connect();
  const products = await Product.find({});
  await db.disconnect();
  res.send(products);
};

export default handler;
