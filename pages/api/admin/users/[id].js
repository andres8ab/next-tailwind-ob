import User from '@/models/User';
import db from '@/utils/db';
import { getToken } from 'next-auth/jwt';

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user || !user.isAdmin) {
    return res.status(401).send('Sesión admin requerida');
  }

  if (req.method === 'GET') {
    return getHandler(req, res, user);
  } else if (req.method === 'PUT') {
    return putHandler(req, res, user);
  } else if (req.method === 'DELETE') {
    return deleteHandler(req, res);
  } else {
    return res.status(400).send({ message: 'Método no permitido' });
  }
};

const getHandler = async (req, res) => {
  await db.connect();
  const user = await User.findById(req.query.id);
  await db.disconnect();
  res.send(user);
};

const putHandler = async (req, res) => {
  await db.connect();
  const user = await User.findById(req.query.id);
  if (user) {
    user.name = req.body.name;
    user.username = req.body.username;
    user.shippingAddress.fullName = req.body.fullName;
    user.shippingAddress.address = req.body.address;
    user.shippingAddress.nit = req.body.nit;
    user.shippingAddress.city = req.body.city;
    user.isClient = Boolean(req.body.isClient);
    await user.save();
    await db.disconnect();
    res.send({ message: 'Usuario actualizado correctamente' });
  } else {
    await db.disconnect();
    res.status(404).send({ message: 'Usuario no encontrado' });
  }
};
const deleteHandler = async (req, res) => {
  await db.connect();
  const user = await User.findById(req.query.id);
  if (user) {
    if (user.email === 'admin@example') {
      return res.status(400).send({ message: 'No se puede eliminar admin' });
    }
    await user.deleteOne();
    await db.disconnect();
    res.send({ message: 'Usuario Eliminado' });
  } else {
    await db.disconnect();
    res.status(404).send({ message: 'Usuario no encontrado' });
  }
};

export default handler;
