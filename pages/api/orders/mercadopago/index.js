import mercadopago from 'mercadopago';
import { getToken } from 'next-auth/jwt';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send('signin required');
  }

  const URL = 'https://next-tailwind-ob.vercel.app';
  // Crea un objeto de preferencia
  try {
    let preference = {
      items: [
        {
          title: req.body.description,
          unit_price: Number(req.body.price),
          quantity: Number(req.body.quantity),
        },
      ],
      back_urls: {
        success: `${URL}/successPage`,
        failure: `${URL}/order-history`,
        pending: '',
      },
      notification_url: `${URL}/api/orders/notify`,
      auto_return: 'approved',
      binary_mode: true,
    };
    const response = await mercadopago.preferences.create(preference);
    // global.id = response.body.id;
    // res.json({
    //   id: response.body.id,
    // });
    res.status(200).send({ id: response.body.id });
  } catch (error) {
    console.log(error);
  }
};
export default handler;
