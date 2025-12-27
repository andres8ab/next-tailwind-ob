import Product from "@/models/Product";
import db from "@/utils/db";

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(200).json([]);
  }

  try {
    await db.connect();
    const products = await Product.find({
      name: {
        $regex: q,
        $options: "i",
      },
    })
      .select("name slug image price")
      .limit(10)
      .lean();
    await db.disconnect();

    const formattedProducts = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    await db.disconnect();
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

export default handler;
