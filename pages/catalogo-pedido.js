import CatalogPedidoScreen from "@/components/CatalogPedidoScreen";
import Layout from "@/components/Layout";
import Product from "@/models/Product";
import db from "@/utils/db";

export default function CatalogoPedidoPage({ products, scope }) {
  return (
    <Layout title="Catálogo — pedido">
      <div className="mx-auto max-w-4xl px-3 pt-4">
        <h1 className="mb-1 text-center text-lg font-bold text-gray-900 dark:text-gray-100">
          Catálogo de productos
        </h1>
        <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <CatalogPedidoScreen products={products} initialScope={scope} />
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ query }) {
  const scope = query.scope === "ob" ? "ob" : "todos";
  await db.connect();
  const products = await Product.find().sort({ slug: 1 }).lean();
  await db.disconnect();
  return {
    props: {
      products: products.map(db.convertDocToObj),
      scope,
    },
  };
}
