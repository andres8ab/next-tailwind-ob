import Order from "@/models/Order";
import db from "@/utils/db";
import { getToken } from "next-auth/jwt";
import Product from "@/models/Product";

const generateEmailContent = (data) => {
  // Check if there are items in each group
  const hasOBItems = data.orderItems.some((item) => item.group === "ob");
  const hasEOBItems = data.orderItems.some((item) => item.group === "eob");

  // Calculate subtotals for each group
  const obSubtotal = data.orderItems
    .filter((item) => item.group === "ob")
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const eobSubtotal = data.orderItems
    .filter((item) => item.group === "eob")
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #ac18c8; margin-bottom: 10px; font-size: 28px;">Nuevo Pedido</h1>
        <h2 style="color: #333; font-size: 22px; margin-bottom: 5px;">${
          data.shippingAddress.fullName
        }</h2>
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;"><strong>NIT:</strong> ${
          data.shippingAddress.nit
        }</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: white; border: 2px solid #ac18c8; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: linear-gradient(135deg, #ac18c8 0%, #d946ef 100%);">
              <th style="padding: 15px; text-align: left; color: white; font-weight: 600; text-transform: uppercase; font-size: 14px;">Producto</th>
              <th style="padding: 15px; text-align: center; color: white; font-weight: 600; text-transform: uppercase; font-size: 14px;">Cantidad</th>
              <th style="padding: 15px; text-align: right; color: white; font-weight: 600; text-transform: uppercase; font-size: 14px;">Precio</th>
            </tr>
          </thead>
          
          ${
            hasOBItems
              ? `
          <tbody>
            <tr style="background-color: #f3f4f6;">
              <td colspan="3" style="padding: 12px 15px; font-weight: 700; color: #ac18c8; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                📦 Pedido para OB
              </td>
            </tr>
            ${data.orderItems
              .filter((item) => item.group === "ob")
              .map(
                (item) => `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
              <td style="padding: 12px 15px; color: #374151;">${item.name}</td>
              <td style="padding: 12px 15px; text-align: center; color: #374151; font-weight: 500;">${
                item.quantity
              }</td>
              <td style="padding: 12px 15px; text-align: right; color: #374151; font-weight: 500;">$${(
                item.price * item.quantity
              ).toLocaleString()}</td>
            </tr>
              `
              )
              .join("")}
            <tr style="background-color: #faf5ff;">
              <td colspan="2" style="padding: 12px 15px; font-weight: 600; color: #7c3aed;">Subtotal OB:</td>
              <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #7c3aed; font-size: 16px;">$${obSubtotal.toLocaleString()}</td>
            </tr>
          </tbody>
          `
              : ""
          }
          
          ${
            hasEOBItems
              ? `
          <tbody>
            <tr style="background-color: #f3f4f6;">
              <td colspan="3" style="padding: 12px 15px; font-weight: 700; color: #ac18c8; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                📦 Pedido para EOB
              </td>
            </tr>
            ${data.orderItems
              .filter((item) => item.group === "eob")
              .map(
                (item) => `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
              <td style="padding: 12px 15px; color: #374151;">${item.name}</td>
              <td style="padding: 12px 15px; text-align: center; color: #374151; font-weight: 500;">${
                item.quantity
              }</td>
              <td style="padding: 12px 15px; text-align: right; color: #374151; font-weight: 500;">$${(
                item.price * item.quantity
              ).toLocaleString()}</td>
            </tr>
              `
              )
              .join("")}
            <tr style="background-color: #faf5ff;">
              <td colspan="2" style="padding: 12px 15px; font-weight: 600; color: #7c3aed;">Subtotal EOB:</td>
              <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: #7c3aed; font-size: 16px;">$${eobSubtotal.toLocaleString()}</td>
            </tr>
          </tbody>
          `
              : ""
          }
          
          <tfoot>
            <tr style="border-top: 2px solid #ac18c8;">
              <td colspan="2" style="padding: 10px 15px; color: #6b7280; font-size: 14px;">Subtotal:</td>
              <td style="padding: 10px 15px; text-align: right; color: #374151; font-weight: 500;">$${data.itemsPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px 15px; color: #6b7280; font-size: 14px;">Precio Envío:</td>
              <td style="padding: 10px 15px; text-align: right; color: #374151; font-weight: 500;">$${data.shippingPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px 15px; color: #6b7280; font-size: 14px;">Descuento:</td>
              <td style="padding: 10px 15px; text-align: right; color: #16a34a; font-weight: 500;">-$${data.discountPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px 15px; color: #6b7280; font-size: 14px;">IVA:</td>
              <td style="padding: 10px 15px; text-align: right; color: #374151; font-weight: 500;">$${data.taxPrice.toLocaleString()}</td>
            </tr>
            <tr style="background: linear-gradient(135deg, #ac18c8 0%, #d946ef 100%);">
              <td colspan="2" style="padding: 15px; color: white; font-weight: 700; font-size: 16px;">TOTAL:</td>
              <td style="padding: 15px; text-align: right; color: white; font-weight: 700; font-size: 18px;">$${data.totalPrice.toLocaleString()}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td colspan="2" style="padding: 10px 15px; color: #6b7280; font-size: 14px;">Método de Pago:</td>
              <td style="padding: 10px 15px; text-align: right; color: #374151; font-weight: 600;">${
                data.paymentMethod
              }</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin-top: 30px;">
          <h2 style="color: #ac18c8; font-size: 20px; margin-bottom: 10px; border-bottom: 2px solid #ac18c8; padding-bottom: 5px;">💬 Comentarios</h2>
          <p style="color: #374151; line-height: 1.6; padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #ac18c8;">
            ${data.comment || "Sin comentarios"}
          </p>
        </div>
        
        <div style="margin-top: 25px;">
          <h2 style="color: #ac18c8; font-size: 20px; margin-bottom: 10px; border-bottom: 2px solid #ac18c8; padding-bottom: 5px;">📍 Dirección de Envío</h2>
          <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #ac18c8;">
            <p style="color: #374151; line-height: 1.8; margin: 0;">
              <strong>${data.shippingAddress.fullName}</strong><br/>
              ${data.shippingAddress.address}<br/>
              ${data.shippingAddress.city}
            </p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #9ca3af; font-size: 12px;">
        <p>Este es un correo automático generado por el sistema de pedidos OB Genuine parts.</p>
      </div>
    </div>
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
    throw new Error("Failed to update stock count: " + error.message);
  }
};
/////////////////////////////////////////////////////////////////////////////////////
import nodemailer from "nodemailer";

const email = process.env.EMAIL;
const pass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass,
  },
});

function emailDestination(seller) {
  if (seller === "Carlos Robledo") {
    return "ochoabawab@gmail.com, comercialcob@gmail.com, heiderpalomino26@gmail.com, importacioneseob@gmail.com, carlor918@gmail.com";
  } else {
    return "ochoabawab@gmail.com, comercialcob@gmail.com, heiderpalomino26@gmail.com, importacioneseob@gmail.com";
  }
}

////////////////////////////////////////////////////////////////////////////////////

const handler = async (req, res) => {
  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send("Se requiere iniciar sesión");
  }
  await db.connect();
  const newOrder = new Order({
    ...req.body,
    user: user._id,
  });
  await transporter.sendMail({
    from: email,
    to: emailDestination(req.body.seller),
    html: generateEmailContent(req.body),
    subject: req.body.shippingAddress.fullName,
  });

  await updateCountInStockForCartItems(req.body.orderItems);

  const order = await newOrder.save();
  res.status(201).send(order);
};
export default handler;
