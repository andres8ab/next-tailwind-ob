import bcryptjs from 'bcryptjs';
import User from '@/models/User';
import db from '@/utils/db';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return;
  }
  const { name, username, password } = req.body;
  if (
    !name ||
    !username ||
    !username.includes('@') ||
    !password ||
    password.trim().length < 5
  ) {
    res.status(422).json({
      message: 'Error de validación',
    });
    return;
  }
  await db.connect();

  const existingUser = await User.findOne({ username: username });
  if (existingUser) {
    res.status(422).json({ message: 'Ya existe un usuario con este nombre' });
    await db.disconnect();
    return;
  }
  const newUser = new User({
    name,
    username,
    password: bcryptjs.hashSync(password),
    isAdmin: false,
    isClient: false,
  });
  const user = await newUser.save();
  await db.disconnect();
  res.status(201).send({
    message: 'Usuario creado correctamente',
    _id: user._id,
    name: user.name,
    username: user.username,
    isAdmin: user.isAdmin,
    isClient: user.isClient,
  });
}
export default handler;
