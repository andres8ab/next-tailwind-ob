import Order from '@/models/Order';
import db from '@/utils/db';
import { getToken } from 'next-auth/jwt';

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user || (user && !user.isAdmin)) {
    return res.status(401).send('sesión de admin requerida');
  }
  if (req.method === 'GET') {
    await db.connect();
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name');
    await db.disconnect();
    res.send(orders);
  } else {
    return res.status(400).send({ message: 'Metodo no permitido' });
  }
};

export default handler;
