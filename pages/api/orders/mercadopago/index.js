import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    res.status(200).send({ url: response.body.init_point });
  } catch (error) {
    console.error('checkout error', error);
  }
};
export default handler;
