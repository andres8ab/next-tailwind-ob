import mercadopago from 'mercadopago';
import { getToken } from 'next-auth/jwt';
import Order from '@/models/Order';
import db from '@/utils/db';

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send('signin required');
  }

  const { query } = req;

  const topic = query.topic || query.type;

  try {
    if (topic === 'payment') {
      const paymentId = query.id || query['data.id'];
      let payment = await mercadopago.payment.findById(paymentId);
      let paymentStatus = payment.body.status;

      console.log([payment, paymentStatus]);
      if (paymentStatus === 'approved') {
        // conectar db findbyid update order payment status
        await db.connect();
        const order = await Order.findById(payment.body.description);
        if (order) {
          order.isPaid = true;
          order.paidAt = Date.now();
          const paidOrder = await order.save();
          await db.disconnect();
          res.send({
            message: 'orden entregada correctamente',
            order: paidOrder,
          });
        } else {
          await db.disconnect();
          res.status(404).send({ message: 'Error: orden no encontrada' });
        }
      }
    }
  } catch (error) {
    res.send(error);
  }
};

export default handler;
