import axios from 'axios';
import React, { useEffect, useState } from 'react';

const MercadoPagoButton = ({ product }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const generateLink = async () => {
      try {
        const { data: preference } = await axios.post(
          '/api/orders/mercadopago',
          {
            description: product.orderId,
            price: product.totalPrice,
            quantity: 1,
          }
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
