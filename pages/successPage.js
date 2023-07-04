import { useRouter } from 'next/router';

const SuccessPage = () => {
  const router = useRouter();
  const { order_id, payment_id } = router.query;
  console.log(router.query);

  // Use the order_id parameter as needed...

  return (
    <div>
      <h1>Payment Success</h1>
      <p>Order ID: {order_id}</p>
      <p>Payment ID: {payment_id}</p>
    </div>
  );
};

export default SuccessPage;
