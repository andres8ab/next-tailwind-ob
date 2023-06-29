import { getToken } from 'next-auth/jwt';
import bcryptjs from 'bcryptjs';
import db from '@/utils/db';
import User from '@/models/User';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(400).send({ message: `${req.method} no soportado` });
  }

  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send({ message: 'Iniciar sesión requerido' });
  }
  const { name, email, password } = req.body;

  if (
    !name ||
    !email ||
    !email.includes('@') ||
    (password && password.trim().length < 5)
  ) {
    res.status(422).json({
      message: 'Error de validación',
    });
    return;
  }

  await db.connect();
  const toUpdateUser = await User.findById(user._id);
  toUpdateUser.name = name;
  toUpdateUser.email = email;

  if (password) {
    toUpdateUser.password = bcryptjs.hashSync(password);
  }
  await toUpdateUser.save();
  await db.disconnect();
  res.send({ message: 'Usuario actualizado' });
}

export default handler;
