import axios from 'axios';
import React, { useEffect, useState } from 'react';

const MercadoPagoButton = ({ product }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const generateLink = async () => {
      try {
        const data = {
          description: product.orderId,
          price: product.totalPrice,
          quantity: 1,
        };

        const config = {
          timeout: 10000,
        };

        const { data: preference } = await axios.post(
          '/api/orders/mercadopago',
          data,
          config
        );
        setUrl(preference.url);
      } catch (err) {
        console.error(err);
      }
    };
    generateLink();
  }, [product.orderId, product.totalPrice]);

  return (
    <div>
      <a className="alert-pay" href={url}>
        Pagar
      </a>
    </div>
  );
};

export default MercadoPagoButton;
