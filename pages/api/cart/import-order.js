import Product from "@/models/Product";
import db from "@/utils/db";
import { parseOrderMessage } from "@/utils/parseOrderMessage";
import { resolveOrderImport } from "@/utils/resolveOrderImport";
import { getToken } from "next-auth/jwt";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Método no permitido" });
  }

  const user = await getToken({ req });
  if (!user) {
    return res.status(401).send({ message: "Se requiere iniciar sesión" });
  }

  const { text, mode = "merge", existingCartItems = [] } = req.body || {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).send({ message: "El pedido está vacío" });
  }

  const parsedLines = parseOrderMessage(text);
  if (parsedLines.length === 0) {
    return res.status(400).send({
      message:
        "No se encontraron líneas válidas. Usá el formato: AL-005 x2",
    });
  }

  await db.connect();
  const products = await Product.find().lean();
  await db.disconnect();

  const normalizedProducts = products.map(db.convertDocToObj);
  const { results, summary } = resolveOrderImport(parsedLines, normalizedProducts, {
    mode: mode === "replace" ? "replace" : "merge",
    existingCartItems: Array.isArray(existingCartItems) ? existingCartItems : [],
  });

  const cartItems = results
    .filter((line) => line.cartItem)
    .map((line) => line.cartItem);

  return res.status(200).send({
    results,
    summary,
    cartItems,
    parsedLines,
  });
};

export default handler;
