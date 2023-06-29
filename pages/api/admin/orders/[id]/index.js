import Order from '@/models/Order';
import Product from '@/models/Product';
import db from '@/utils/db';
import { getToken } from 'next-auth/jwt';

// Function to update the stock count for multiple order items
const updateCountInStockForOrderItems = async (orderItems) => {
  try {
    const updatedOrderItems = [];

    // Iterate through each order item
    for (const orderItem of orderItems) {
      const { slug, quantity } = orderItem;

      // Retrieve the product from the database
      const product = await Product.findOne({ slug });

      // Check if the product exists
      if (!product) {
        throw new Error(`Product with ID ${slug} not found`);
      }

      // Update the stock count
      const updatedCountInStock = product.countInStock + quantity;

      // Update the product with the new stock count
      await Product.updateOne(
        { slug },
        { $set: { countInStock: updatedCountInStock } }
      );

      // Add the updated cart item to the array
      updatedOrderItems.push({ slug, quantity, updatedCountInStock });
    }
    // Return the updated cart items
    console.log(updatedOrderItems);
    return updatedOrderItems;
  } catch (error) {
    throw new Error('Failed to update stock count: ' + error.message);
  }
};
///////////////////////////////////////////////////////

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user || !user.isAdmin) {
    return res.status(401).send('Sesión admin requerida');
  }
  await db.connect();
  const order = await Order.findById(req.query.id);
  if (order) {
    const updatedOrderItems = await updateCountInStockForOrderItems(
      order.orderItems
    );
    console.log('Stock count updated for order items:', updatedOrderItems);

    await order.deleteOne();
    await db.disconnect();
    res.send({ message: 'Usuario Eliminado' });
    res.send({ message: 'Orden Eliminada' });
  } else {
    await db.disconnect();
    res.status(404).send({ message: 'Usuario no encontrado' });
    res.status(404).send({ message: 'Orden no encontrada' });
  }
};

export default handler;
