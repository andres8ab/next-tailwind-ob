import User from '@/models/User';
import db from '@/utils/db';
import { getToken } from 'next-auth/jwt';

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send('Iniciar sesión requerido');
  }
  await db.connect();
  const userClient = await User.findById(req.query.id);
  await db.disconnect();
  res.send(userClient);
};

export default handler;
