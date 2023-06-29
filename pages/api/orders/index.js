import Order from '@/models/Order';
import db from '@/utils/db';
import { getToken } from 'next-auth/jwt';
import { mailOptions, transporter } from '@/utils/nodemailer';
import Product from '@/models/Product';

const generateEmailContent = (data) => {
  return `<h1>Nuevo Pedido de: ${data.shippingAddress.fullName}</h1>
  <h2>Nit: ${data.shippingAddress.nit}</h2>
  <p>
  <table style="background-color:#ac18c8;
  border:1px solid;
  color:white;">
  <thead style="background:rgba(243, 140, 210, 0.4);">
  <tr>
  <td style="padding:1rem;text-transform:uppercase;"><strong>Producto</strong></td>
  <td style="padding:1rem;text-transform:uppercase;"><strong>Cantidad</strong></td>
  <td style="padding:1rem;text-transform:uppercase;" align="right"><strong>Precio</strong></td>
  </thead>
  <tr style="color:black">°pedido para OB°</tr>
  <tbody>
  ${data.orderItems
    .filter((item) => item.group === 'ob')
    .map(
      (item) => `
    <tr>
    <td style="border-bottom:1px solid;
  padding:1rem;">${item.name}</td>
    <td style="border-bottom:1px solid;
  padding:1rem;" align="center">${item.quantity}</td>
    <td style="border-bottom:1px solid;
  padding:1rem;" align="right"> $${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('\n')}
  </tbody>
  <tr style="color:black">°pedido para EOB°</tr>
  <tbody>
  ${data.orderItems
    .filter((item) => item.group === 'eob')
    .map(
      (item) => `
    <tr>
    <td style="border-bottom:1px solid;
  padding:1rem;">${item.name}</td>
    <td style="border-bottom:1px solid;
  padding:1rem;" align="center">${item.quantity}</td>
    <td style="border-bottom:1px solid;
  padding:1rem;" align="right"> $${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('\n')}
  </tbody>
  <tfoot>
  <tr>
  <td colspan="2">Subtotal:</td>
  <td align="right"> $${data.itemsPrice.toLocaleString()}</td>
  </tr>
  <tr>
  <td colspan="2">Precio Envío:</td>
  <td align="right"> $${data.shippingPrice.toLocaleString()}</td>
  </tr>
  <tr>
  <td colspan="2">Iva:</td>
  <td align="right"> $${data.taxPrice.toLocaleString()}</td>
  </tr>
  <tr>
  <td colspan="2"><strong>Total:</strong></td>
  <td align="right"><strong> $${data.totalPrice.toLocaleString()}</strong></td>
  </tr>
  <tr>
  <td colspan="2">Método de Pago:</td>
  <td align="right">${data.paymentMethod}</td>
  </tr>
  </table>
  <h2>Direccion Envío</h2>
  <p>
  ${data.shippingAddress.fullName},<br/>
  ${data.shippingAddress.address},<br/>
  ${data.shippingAddress.city},<br/>
  </p>
  <hr/>
  `;
};

//////////////////////////////////////////////////////////////////////////////////
// Function to update the stock count for multiple cart items
const updateCountInStockForCartItems = async (cartItems) => {
  try {
    const updatedCartItems = [];

    // Iterate through each cart item
    for (const cartItem of cartItems) {
      const { _id, quantity } = cartItem;

      // Retrieve the product from the database
      const product = await Product.findOne({ _id });

      // Check if the product exists
      if (!product) {
        throw new Error(`Product with ID ${_id} not found`);
      }
      // Check if there is sufficient stock
      if (product.countInStock < quantity) {
        throw new Error(`Insufficient stock for product with ID ${_id}`);
      }

      // Update the stock count
      const updatedCountInStock = product.countInStock - quantity;

      // Update the product with the new stock count
      await Product.updateOne(
        { _id },
        { $set: { countInStock: updatedCountInStock } }
      );

      // Add the updated cart item to the array
      updatedCartItems.push({ _id, quantity, updatedCountInStock });
    }
    // Return the updated cart items
    console.log(updatedCartItems);
    return updatedCartItems;
  } catch (error) {
    throw new Error('Failed to update stock count: ' + error.message);
  }
};

////////////////////////////////////////////////////////////////////////////////////

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send('Se requiere iniciar sesión');
  }
  await db.connect();
  const newOrder = new Order({
    ...req.body,
    user: user._id,
  });
  await transporter.sendMail({
    ...mailOptions,
    html: generateEmailContent(req.body),
    subject: req.body.shippingAddress.fullName,
  });

  const updatedCartItems = await updateCountInStockForCartItems(
    req.body.orderItems
  );
  console.log('Stock count updated for cart items:', updatedCartItems);

  const order = await newOrder.save();
  res.status(201).send(order);
};
export default handler;
