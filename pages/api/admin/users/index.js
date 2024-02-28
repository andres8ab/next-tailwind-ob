import bcrypt from 'bcryptjs'
import User from '@/models/User'
import db from '@/utils/db'
import { getToken } from 'next-auth/jwt'

const handler = async (req, res) => {
  const user = await getToken({ req })
  if (!user || !user.isAdmin) {
    return res.status(401).send('Sesión admin requerida')
  }
  if (req.method === 'GET') {
    return getHandler(req, res)
  } else if (req.method === 'POST') {
    return postHandler(req, res)
  } else {
    return res.status(400).send({ message: 'Método no permitido' })
  }
}
const postHandler = async (req, res) => {
  await db.connect()
  const newUser = new User({
    name: 'Autopartes Wendy',
    username: '227126600',
    password: bcrypt.hashSync('123456'),
    isAdmin: 'false',
    isClient: 'true',
    seller: 'Carlos Robledo',
    clientDiscount: 0,
    shippingAddress: {
      fullName: 'Autopartes Wendy',
      address: 'Calle 0 # 1 - 2',
      nit: '227126600-0',
      city: 'Barranquilla',
    },
    paymentMethod: 'Credito',
  })

  const user = await newUser.save()
  await db.disconnect()
  res.send({ message: 'Usuario creado correctamente', user })
}

const getHandler = async (req, res) => {
  await db.connect()
  const users = await User.find({})
  await db.disconnect()
  res.send(users)
}

export default handler
